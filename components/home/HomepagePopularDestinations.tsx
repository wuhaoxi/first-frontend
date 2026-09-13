'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { AttractionSummary } from '@/types/attraction';

interface HomepagePopularDestinationsProps {
  attractions: AttractionSummary[];
  onAttractionClick?: (slug: string) => void;
}

const MAX_ATTRACTIONS = 6;

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
          onClick={(e) => {
            if (onAttractionClick) {
              e.preventDefault();
              onAttractionClick(attraction.slug);
            }
          }}
        >
          <div className="group relative overflow-hidden rounded-lg">
            <div className="relative aspect-[4/3] w-full">
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
            </div>
            <div className="p-2">
              <h3 className="text-sm font-medium">{attraction.name}</h3>
              <p className="text-xs text-muted-foreground">{attraction.nameZh}</p>
              <p className="text-xs text-muted-foreground">{attraction.city}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
