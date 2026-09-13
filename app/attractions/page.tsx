'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AttractionCard } from '@/components/attraction/AttractionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getAttractions } from '@/lib/api/attractions';
import { CATEGORY_LABELS, CITY_OPTIONS } from '@/lib/attraction-meta';
import { cn } from '@/lib/utils';
import type { AttractionCategory, AttractionSummary } from '@/types/attraction';

const PAGE_SIZE = 20;

const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS) as AttractionCategory[];

const SKELETON_KEYS = [1, 2, 3];

function AttractionCardSkeletonCard() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium',
        active
          ? 'bg-primary text-primary-foreground'
          : 'border text-muted-foreground hover:bg-secondary'
      )}
    >
      {label}
    </button>
  );
}

export default function AttractionsPage() {
  const [attractions, setAttractions] = useState<AttractionSummary[]>([]);
  const [city, setCity] = useState<string | null>(null);
  const [category, setCategory] = useState<AttractionCategory | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const generationRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchFirstPage = useCallback((nextCity: string | null, nextCategory: AttractionCategory | null) => {
    const generation = ++generationRef.current;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setLoadMoreError(null);
    setAttractions([]);
    setPage(0);
    getAttractions({
      ...(nextCity !== null ? { city: nextCity } : {}),
      ...(nextCategory !== null ? { category: nextCategory } : {}),
      page: 0,
      size: PAGE_SIZE,
    })
      .then((res) => {
        if (generationRef.current !== generation) {
          return;
        }
        setAttractions(res.content);
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .catch((err) => {
        if (generationRef.current !== generation) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load attractions');
      })
      .finally(() => {
        if (generationRef.current === generation) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    fetchFirstPage(null, null);
  }, [fetchFirstPage]);

  const handleCityChange = (nextCity: string | null) => {
    if (nextCity === city) {
      return;
    }
    setCity(nextCity);
    fetchFirstPage(nextCity, category);
  };

  const handleCategoryChange = (nextCategory: AttractionCategory | null) => {
    if (nextCategory === category) {
      return;
    }
    setCategory(nextCategory);
    fetchFirstPage(city, nextCategory);
  };

  const hasMore = page + 1 < totalPages;

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    const generation = generationRef.current;
    setLoadingMore(true);
    setLoadMoreError(null);
    getAttractions({
      ...(city !== null ? { city } : {}),
      ...(category !== null ? { category } : {}),
      page: page + 1,
      size: PAGE_SIZE,
    })
      .then((res) => {
        if (generationRef.current !== generation) {
          return;
        }
        setAttractions((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const fresh = res.content.filter((item) => !existingIds.has(item.id));
          return [...prev, ...fresh];
        });
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .catch((err) => {
        if (generationRef.current !== generation) {
          return;
        }
        setLoadMoreError(err instanceof Error ? err.message : 'Failed to load more attractions');
      })
      .finally(() => {
        if (generationRef.current === generation) {
          setLoadingMore(false);
        }
      });
  }, [loading, loadingMore, hasMore, city, category, page]);

  const observerEligible =
    !loading && !loadingMore && hasMore && !error && !loadMoreError && attractions.length > 0;

  useEffect(() => {
    if (!observerEligible) {
      return;
    }
    const node = sentinelRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [observerEligible, loadMore]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attractions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated sights across China, from imperial palaces to riverside streets
        </p>
      </div>

      {/* City filter */}
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter by city">
        <FilterChip label="All" active={city === null} onClick={() => handleCityChange(null)} />
        {CITY_OPTIONS.map((option) => (
          <FilterChip
            key={option.slug}
            label={option.label}
            active={city === option.slug}
            onClick={() => handleCityChange(option.slug)}
          />
        ))}
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <FilterChip
          label="All"
          active={category === null}
          onClick={() => handleCategoryChange(null)}
        />
        {CATEGORY_OPTIONS.map((value) => (
          <FilterChip
            key={value}
            label={CATEGORY_LABELS[value]}
            active={category === value}
            onClick={() => handleCategoryChange(value)}
          />
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SKELETON_KEYS.map((key) => (
            <AttractionCardSkeletonCard key={key} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchFirstPage(city, category)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && attractions.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No attractions found</p>
        </div>
      )}

      {/* Attraction grid */}
      {!loading && !error && attractions.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {attractions.map((attraction) => (
            <AttractionCard key={attraction.id} attraction={attraction} />
          ))}
          {loadingMore &&
            SKELETON_KEYS.map((key) => <AttractionCardSkeletonCard key={`skeleton-${key}`} />)}
        </div>
      )}

      {/* Auto-load sentinel */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* Load-more error */}
      {!loading && !error && loadMoreError && (
        <div className="mt-8 text-center">
          <p className="mb-3 text-sm text-destructive" role="alert">
            {loadMoreError}
          </p>
          <button
            type="button"
            onClick={loadMore}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Retry
          </button>
        </div>
      )}

      {/* End of list */}
      {!loading && !error && attractions.length > 0 && !hasMore && (
        <p className="mt-8 text-center text-sm text-muted-foreground">You&apos;ve reached the end</p>
      )}
    </div>
  );
}
