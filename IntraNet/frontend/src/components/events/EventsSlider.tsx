import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaCarouselType } from 'embla-carousel'
import type { EventoDTO } from '../../services/events'

type Props = {
  events: EventoDTO[]
  loading?: boolean
  onSelect?: (event: EventoDTO) => void
}

function isActiveEvent(event: EventoDTO) {
  if (event.activo === false) return false
  const today = new Date().toISOString().slice(0, 10)
  const fin = String(event.fecha_fin || event.fecha_inicio || '').slice(0, 10)
  return fin >= today
}

export function EventsSlider({ events, loading, onSelect }: Props) {
  const activeEvents = events.filter(isActiveEvent)
  const slides = activeEvents
  const autoplayPaused = useRef(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [prevEnabled, setPrevEnabled] = useState(false)
  const [nextEnabled, setNextEnabled] = useState(false)

  const loop = slides.length > 1
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

  useEffect(() => {
    if (!emblaApi) return
    syncCarousel(emblaApi)
    emblaApi.on('select', syncCarousel)
    emblaApi.on('reInit', syncCarousel)
    return () => {
      emblaApi.off('select', syncCarousel)
      emblaApi.off('reInit', syncCarousel)
    }
  }, [emblaApi, syncCarousel])

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) return
    const interval = window.setInterval(() => {
      if (autoplayPaused.current) return
      emblaApi.scrollNext()
    }, 5500)
    return () => window.clearInterval(interval)
  }, [emblaApi, slides.length])

  if (loading) {
    return (
      <section className="events-slider events-slider--loading" aria-label="Eventos destacados">
        <div className="skeleton-line wide" style={{ height: 200, borderRadius: 20 }} />
      </section>
    )
  }

  if (slides.length === 0) {
    return (
      <section className="events-slider events-slider--empty" aria-label="Eventos destacados">
        <div className="events-slider__empty">
          <CalendarDays size={28} />
          <p>No hay eventos activos en este momento.</p>
        </div>
      </section>
    )
  }

  return (
    <section
      className="events-slider bc-carousel"
      aria-label="Eventos destacados"
      onMouseEnter={() => { autoplayPaused.current = true }}
      onMouseLeave={() => { autoplayPaused.current = false }}
      onFocusCapture={() => { autoplayPaused.current = true }}
      onBlurCapture={() => { autoplayPaused.current = false }}
    >
      <div className="bc-carousel__stage">
        <div className="bc-carousel__viewport-wrap">
          <div className="bc-carousel__viewport events-slider__viewport" ref={emblaRef}>
            <div className="bc-carousel__container">
              {slides.map((event) => (
                <div className="bc-carousel__slide" key={event.id}>
                  <button
                    type="button"
                    className="events-slider__slide"
                    onClick={() => onSelect?.(event)}
                  >
                    {event.imagen_url ? (
                      <img src={event.imagen_url} alt={event.titulo} className="events-slider__image" />
                    ) : (
                      <div className="events-slider__placeholder">
                        <CalendarDays size={32} />
                      </div>
                    )}
                    <div className="events-slider__overlay" aria-hidden="true" />
                    <div className="events-slider__copy">
                      <h2>{event.titulo}</h2>
                      {event.lugar && <p>{event.lugar}</p>}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {slides.length > 1 && (
            <>
              <button
                type="button"
                className="bc-carousel__nav bc-carousel__nav--overlay bc-carousel__nav--prev"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!prevEnabled && !loop}
                aria-label="Evento anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="bc-carousel__nav bc-carousel__nav--overlay bc-carousel__nav--next"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!nextEnabled && !loop}
                aria-label="Evento siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {slides.length > 1 && (
          <div className="bc-carousel__dots" aria-label="Indicadores de eventos">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`bc-carousel__dot${selectedIndex === index ? ' bc-carousel__dot--active' : ''}`}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Ir al evento ${index + 1}`}
                aria-current={selectedIndex === index ? 'true' : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
