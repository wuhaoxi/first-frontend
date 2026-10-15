'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { AttractionSummary } from '@/types/attraction';

const MAX_SLIDES = 5;
const AUTOPLAY_INTERVAL_MS = 5000;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const CONTROL_CLASS =
  'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface HomepageFeaturedDestinationsProps {
  attractions: AttractionSummary[];
}

export function HomepageFeaturedDestinations({ attractions }: HomepageFeaturedDestinationsProps) {
  const slides = attractions.slice(0, MAX_SLIDES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotionRef = useRef(false);

  const totalSlides = slides.length;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (totalSlides < 2 || paused || reducedMotionRef.current) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, AUTOPLAY_INTERVAL_MS);
  }, [totalSlides, paused, stopTimer]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    startTimer();
    return stopTimer;
  }, [startTimer, stopTimer]);

  if (totalSlides === 0) return null;

  const current = slides[activeIndex];

  const goTo = (index: number) => {
    setActiveIndex(index);
    startTimer();
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
    startTimer();
  };

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    startTimer();
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured destinations"
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        startTimer();
      }}
      onFocus={() => setPaused(true)}
      onBlur={() => {
        setPaused(false);
        startTimer();
      }}
    >
      <Link
        href={`/attractions/${current.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
          {current.coverImageUrl ? (
            <Image
              src={current.coverImageUrl}
              alt={current.name}
              fill
              sizes="(max-width: 768px) 100vw, 1280px"
              priority={activeIndex === 0}
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 pb-12 text-white">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-black/50 px-2.5 py-0.5 backdrop-blur">
                {current.city}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5 backdrop-blur">
                <Star className="h-3.5 w-3.5 fill-current text-amber-400" aria-hidden="true" />
                {current.ratingScore.toFixed(1)}
              </span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{current.name}</h3>
            <p className="text-sm text-white/80">{current.nameZh}</p>
            <p className="line-clamp-2 max-w-2xl text-sm text-white/90">{current.summary}</p>
          </div>
        </div>
      </Link>

      {totalSlides > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 p-2 text-foreground shadow transition-colors hover:bg-background ${CONTROL_CLASS}`}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className={`absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 p-2 text-foreground shadow transition-colors hover:bg-background ${CONTROL_CLASS}`}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <div
            role="tablist"
            aria-label="Choose slide"
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"
          >
            {slides.map((slide, index) => (
              <button
                key={slide.slug}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Slide ${index + 1}`}
                onClick={() => goTo(index)}
                className={`h-2 w-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  index === activeIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
