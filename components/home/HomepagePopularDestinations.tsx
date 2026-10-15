'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { AttractionSummary } from '@/types/attraction';

interface HomepagePopularDestinationsProps {
  attractions: AttractionSummary[];
  onAttractionClick?: (slug: string) => void;
}

const MAX_ATTRACTIONS = 6;

const CARD_CLASS =
  'group block overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function HomepagePopularDestinations({
  attractions,
  onAttractionClick,
}: HomepagePopularDestinationsProps) {
  if (attractions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No attractions available right now
      </p>
    );
  }

  const displayAttractions = attractions.slice(0, MAX_ATTRACTIONS);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {displayAttractions.map((attraction) => (
        <Link
          key={attraction.slug}
          href={`/attractions/${attraction.slug}`}
          className={CARD_CLASS}
          onClick={(e) => {
            if (onAttractionClick) {
              e.preventDefault();
              onAttractionClick(attraction.slug);
            }
          }}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            {attraction.coverImageUrl ? (
              <Image
                src={attraction.coverImageUrl}
                alt={attraction.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <span className="text-2xl text-muted-foreground">
                  {attraction.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
              <Star className="h-3.5 w-3.5 fill-current text-amber-400" aria-hidden="true" />
              {attraction.ratingScore.toFixed(1)}
            </span>
          </div>
          <div className="p-3">
            <h3 className="text-sm font-medium">{attraction.name}</h3>
            <p className="text-xs text-muted-foreground">{attraction.nameZh}</p>
            <p className="text-xs text-muted-foreground">{attraction.city}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
