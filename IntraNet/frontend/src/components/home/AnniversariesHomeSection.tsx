// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: AnniversariesHomeSection.
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import type { AniversarioPersona } from "../../services/celebraciones";
import { BirthdayAvatar } from "./BirthdayAvatar";

// Prepara el valor para su uso.
function formatDay(date?: string) {
  if (!date) return "Sin fecha";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

// Gestiona la operacion AnniversaryCard.
export function AnniversaryCard({ person }: { person: AniversarioPersona }) {
  return (
    <article className="anniversary-card">
      <div className="anniversary-card__media">
        <BirthdayAvatar
          foto={person.foto}
          nombreCompleto={person.nombreCompleto}
          size="xs"
          compact
          className="anniversary-card__avatar"
        />
        <div className="icon-tile">
          <Trophy size={18} aria-hidden="true" />
        </div>
      </div>
      <div className="anniversary-card__body">
        <h3>
          {person.nombreCompleto} cumple {person.anios} años en la empresa
        </h3>
        <p>
          {person.area || "Organización"}
          {person.sucursal ? ` · ${person.sucursal}` : ""} ·{" "}
          {formatDay(person.fecha)}
        </p>
      </div>
    </article>
  );
}

interface AnniversaryCarouselProps {
  people: AniversarioPersona[];
}

// Gestiona la operacion AnniversaryCarousel.
export function AnniversaryCarousel({ people }: AnniversaryCarouselProps) {
  const autoplayPaused = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [prevEnabled, setPrevEnabled] = useState(false);
  const [nextEnabled, setNextEnabled] = useState(false);

  const loop = people.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop,
    slidesToScroll: 1,
    duration: 35,
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const syncCarousel = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
    setScrollSnaps(api.scrollSnapList());
    setPrevEnabled(api.canScrollPrev());
    setNextEnabled(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    syncCarousel(emblaApi);
    emblaApi.on("select", syncCarousel);
    emblaApi.on("reInit", syncCarousel);
    return () => {
      emblaApi.off("select", syncCarousel);
      emblaApi.off("reInit", syncCarousel);
    };
  }, [emblaApi, syncCarousel]);

  useEffect(() => {
    if (!emblaApi || people.length <= 1) return;
    const interval = window.setInterval(() => {
      if (autoplayPaused.current) return;
      emblaApi.scrollNext();
    }, 7000);
    return () => window.clearInterval(interval);
  }, [emblaApi, people.length]);

  if (people.length === 0) return null;

  return (
    <section
      className="anniversary-carousel bc-carousel"
      aria-label="Aniversarios de hoy"
      onMouseEnter={() => {
        autoplayPaused.current = true;
      }}
      onMouseLeave={() => {
        autoplayPaused.current = false;
      }}
    >
      <div className="bc-carousel__stage">
        <div className="bc-carousel__viewport-wrap">
          <div
            className="bc-carousel__viewport anniversary-carousel__viewport"
            ref={emblaRef}
          >
            <div className="bc-carousel__container">
              {people.map((person) => (
                <div
                  className="bc-carousel__slide"
                  key={`${person.id}-${person.anios}`}
                >
                  <AnniversaryCard person={person} />
                </div>
              ))}
            </div>
          </div>

          {people.length > 1 && (
            <>
              <button
                type="button"
                className="bc-carousel__nav bc-carousel__nav--overlay bc-carousel__nav--prev"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!prevEnabled && !loop}
                aria-label="Aniversario anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="bc-carousel__nav bc-carousel__nav--overlay bc-carousel__nav--next"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!nextEnabled && !loop}
                aria-label="Aniversario siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {people.length > 1 && (
          <div
            className="bc-carousel__dots"
            aria-label="Indicadores de aniversarios"
          >
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`bc-carousel__dot${selectedIndex === index ? " bc-carousel__dot--active" : ""}`}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Ir al aniversario ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Prepara el estado o comportamiento del componente.
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    // Gestiona la accion correspondiente.
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

interface AnniversariesHomeSectionProps {
  people: AniversarioPersona[];
}

// Gestiona la operacion AnniversariesHomeSection.
export function AnniversariesHomeSection({
  people,
}: AnniversariesHomeSectionProps) {
  const isCarousel = useMediaQuery("(max-width: 960px)");

  return (
    <section className="employee-home-section">
      <div className="employee-home-section__head">
        <Trophy size={16} aria-hidden="true" />
        <span>Aniversarios</span>
      </div>

      {people.length === 0 ? (
        <p className="bc-accordion__empty employee-home-empty">
          No hay aniversarios para hoy.
        </p>
      ) : isCarousel ? (
        <AnniversaryCarousel people={people} />
      ) : (
        <div className="anniversary-grid anniversary-grid--triple">
          {people.map((person) => (
            <AnniversaryCard
              key={`${person.id}-${person.anios}`}
              person={person}
            />
          ))}
        </div>
      )}
    </section>
  );
}
