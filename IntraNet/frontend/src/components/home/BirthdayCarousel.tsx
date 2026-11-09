// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: carrusel de contenido.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaCarouselType } from 'embla-carousel'
import type { CelebracionPersona } from '../../services/celebraciones'
import { BirthdayCard } from './BirthdayCard'
import { BirthdayUpcomingAccordion } from './BirthdayUpcomingAccordion'

interface BirthdayCarouselProps {
  persons: CelebracionPersona[]
  autoplayInterval?: number
  upcomingPersons?: CelebracionPersona[]
  className?: string
}

// Calcula el resultado correspondiente.
function computeIsToday(p: CelebracionPersona) {
  return p.esHoy === true || p.diasRestantes === 0
}

// Calcula el resultado correspondiente.
function computeIsUpcoming(p: CelebracionPersona) {
  const today = computeIsToday(p)
  return !today && (p.diasRestantes ?? 99) < 7
}

// Gestiona la operacion BirthdayCarousel.
export function BirthdayCarousel({
  persons,
  autoplayInterval = 5000,
  upcomingPersons = [],
  className,
}: BirthdayCarouselProps) {
  const autoplayPaused = useRef(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [prevEnabled, setPrevEnabled] = useState(false)
  const [nextEnabled, setNextEnabled] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const loop = persons.length > 1

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop,
    slidesToScroll: 1,
    duration: 35,
    dragFree: false,
    containScroll: 'trimSnaps',
  })

  const syncCarousel = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap())
    setScrollSnaps(api.scrollSnapList())
    setPrevEnabled(api.canScrollPrev())
    setNextEnabled(api.canScrollNext())
  }, [])

  const onPointerDown = useCallback(() => setIsDragging(true), [])
  const onPointerUp = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (!emblaApi) return

    syncCarousel(emblaApi)
    emblaApi.on('select', syncCarousel)
    emblaApi.on('reInit', syncCarousel)
    emblaApi.on('pointerDown', onPointerDown)
    emblaApi.on('pointerUp', onPointerUp)

    return () => {
      emblaApi.off('select', syncCarousel)
      emblaApi.off('reInit', syncCarousel)
      emblaApi.off('pointerDown', onPointerDown)
      emblaApi.off('pointerUp', onPointerUp)
    }
  }, [emblaApi, syncCarousel, onPointerDown, onPointerUp])

  useEffect(() => {
    if (!emblaApi || autoplayInterval <= 0) return

    // Gestiona la operacion tick.
    const tick = () => {
      if (autoplayPaused.current) return
      emblaApi.scrollNext()
    }

    const id = window.setInterval(tick, autoplayInterval)
    return () => window.clearInterval(id)
  }, [emblaApi, autoplayInterval])

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi],
  )

  const showControls = scrollSnaps.length > 1

  return (
    <div
      className={`bc-carousel${className ? ` ${className}` : ''}`}
      role="region"
      aria-label="Carrusel de cumpleaños"
      aria-roledescription="carrusel"
      onMouseEnter={() => { autoplayPaused.current = true }}
      onMouseLeave={() => { autoplayPaused.current = false }}
      onFocusCapture={() => { autoplayPaused.current = true }}
      onBlurCapture={() => { autoplayPaused.current = false }}
    >
      <div className="bc-carousel__stage">
        <div className="bc-carousel__viewport-wrap">
          <div
            ref={emblaRef}
            className={`bc-carousel__viewport${isDragging ? ' bc-carousel__viewport--dragging' : ''}`}
          >
            <div className="bc-carousel__container">
              {persons.map((person) => (
                <div className="bc-carousel__slide" key={String(person.id)}>
                  <BirthdayCard
                    person={person}
                    isToday={computeIsToday(person)}
                    isUpcoming={computeIsUpcoming(person)}
                    variant="featured"
                    showAccordion={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {showControls && (
            <>
              <button
                type="button"
                onClick={scrollPrev}
                disabled={!prevEnabled}
                aria-label="Tarjeta anterior"
                className="bc-carousel__nav bc-carousel__nav--overlay bc-carousel__nav--prev"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={!nextEnabled}
                aria-label="Tarjeta siguiente"
                className="bc-carousel__nav bc-carousel__nav--overlay bc-carousel__nav--next"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {showControls && (
        <div className="bc-carousel__dots" aria-label="Indicadores del carrusel">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Ir a la tarjeta ${index + 1}`}
              aria-current={selectedIndex === index ? 'true' : undefined}
              className={`bc-carousel__dot${selectedIndex === index ? ' bc-carousel__dot--active' : ''}`}
            />
          ))}
        </div>
      )}

      <BirthdayUpcomingAccordion persons={upcomingPersons} alwaysShow />
    </div>
  )
}
