'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FeaturedGuide } from '@/types/home';

interface HomepageEditorsPicksProps {
  guides: FeaturedGuide[];
  autoPlayIntervalMs?: number;
  onGuideClick?: (slug: string) => void;
}

export function HomepageEditorsPicks({
  guides,
  autoPlayIntervalMs = 5000,
  onGuideClick,
}: HomepageEditorsPicksProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSlides = guides.length;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (totalSlides < 2 || paused) return;
    stopTimer();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, autoPlayIntervalMs);
  }, [totalSlides, paused, autoPlayIntervalMs, stopTimer]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      startTimer();
    }
    return stopTimer;
  }, [startTimer, stopTimer]);

  if (guides.length === 0) return null;

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

  const handleClick = (slug: string) => {
    if (onGuideClick) {
      onGuideClick(slug);
    }
  };

  const current = guides[activeIndex];

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured guides"
      onClick={() => handleClick(current.slug)}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(current.slug); }}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); startTimer(); }}
      onFocus={() => setPaused(true)}
      onBlur={() => { setPaused(false); startTimer(); }}
    >
      <div className="relative aspect-[16/9] w-full">
        {current.coverImageUrl ? (
          <Image
            src={current.coverImageUrl}
            alt={current.title}
            fill
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-2xl font-bold">{current.title}</h3>
          <p className="text-sm opacity-90">{current.cityName}</p>
          <p className="mt-1 text-sm line-clamp-2">{current.recommendation}</p>
        </div>
      </div>

      {/* Navigation arrows */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow hover:bg-background transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow hover:bg-background transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {totalSlides > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2" role="tablist">
          {guides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === activeIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
