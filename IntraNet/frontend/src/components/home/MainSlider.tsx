import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { sliderService, type SliderSlideDTO } from "../../services/slider";

function SlideContent({ slide }: { slide: SliderSlideDTO }) {
  const hasCopy = !!(slide.titulo?.trim() || slide.subtitulo?.trim());
  const showTitle = slide.mostrar_titulo !== false && hasCopy;

  const inner = (
    <article
      className={`main-slider__slide-inner${showTitle ? "" : " main-slider__slide-inner--image-only"}`}
    >
      <img
        src={slide.imagen_url}
        alt={showTitle && slide.titulo ? slide.titulo : "Slide del inicio"}
        className="main-slider__image"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
      {showTitle && (
        <>
          <div className="main-slider__overlay" aria-hidden="true" />
          <div className="main-slider__copy">
            {slide.titulo?.trim() && <h2>{slide.titulo}</h2>}
            {slide.subtitulo?.trim() && <p>{slide.subtitulo}</p>}
          </div>
        </>
      )}
    </article>
  );

  const link = slide.enlace?.trim();
  if (!link) return inner;

  if (/^https?:\/\//i.test(link)) {
    return (
      <a
        href={link}
        className="main-slider__link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      to={link.startsWith("/") ? link : `/${link}`}
      className="main-slider__link"
    >
      {inner}
    </Link>
  );
}

export function MainSlider() {
  const [slides, setSlides] = useState<SliderSlideDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const autoplayPaused = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [prevEnabled, setPrevEnabled] = useState(false);
  const [nextEnabled, setNextEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchSlides = () => {
      setLoading(true);
      sliderService
        .getAll()
        .then((res) => {
          if (!active) return;
          setSlides((res.data || []).filter((s) => s.activo !== false));
        })
        .catch(() => {
          if (active) setSlides([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchSlides();

    const onSliderChanged = () => {
      fetchSlides();
    };
    window.addEventListener("portal:home-slider-changed", onSliderChanged);
    return () => {
      active = false;
      window.removeEventListener("portal:home-slider-changed", onSliderChanged);
    };
  }, []);

  const loop = slides.length > 1;
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
    if (!emblaApi || slides.length <= 1) return;
    const interval = window.setInterval(() => {
      if (autoplayPaused.current) return;
      emblaApi.scrollNext();
    }, 6000);
    return () => window.clearInterval(interval);
  }, [emblaApi, slides.length]);

  if (loading) {
    return (
      <section
        className="main-slider main-slider--loading"
        aria-label="Slider principal"
      >
        <div className="skeleton-line wide main-slider__skeleton" />
      </section>
    );
  }

  if (slides.length === 0) return null;

  return (
    <section
      className="main-slider bc-carousel"
      aria-label="Slider principal"
      onMouseEnter={() => {
        autoplayPaused.current = true;
      }}
      onMouseLeave={() => {
        autoplayPaused.current = false;
      }}
      onFocusCapture={() => {
        autoplayPaused.current = true;
      }}
      onBlurCapture={() => {
        autoplayPaused.current = false;
      }}
    >
      <div className="bc-carousel__stage">
        <div className="bc-carousel__viewport-wrap">
          <div
            className="bc-carousel__viewport main-slider__viewport"
            ref={emblaRef}
          >
            <div className="bc-carousel__container">
              {slides.map((slide) => (
                <div className="bc-carousel__slide" key={slide.id}>
                  <SlideContent slide={slide} />
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
                aria-label="Slide anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="bc-carousel__nav bc-carousel__nav--overlay bc-carousel__nav--next"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!nextEnabled && !loop}
                aria-label="Slide siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {slides.length > 1 && (
          <div
            className="bc-carousel__dots"
            aria-label="Indicadores del slider"
          >
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`bc-carousel__dot${selectedIndex === index ? " bc-carousel__dot--active" : ""}`}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Ir al slide ${index + 1}`}
                aria-current={selectedIndex === index ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
