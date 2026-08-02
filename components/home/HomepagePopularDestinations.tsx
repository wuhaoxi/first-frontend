'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PopularCity } from '@/types/home';

interface HomepagePopularDestinationsProps {
  cities: PopularCity[];
  onCityClick?: (slug: string) => void;
}

const MAX_CITIES = 6;

export function HomepagePopularDestinations({
  cities,
  onCityClick,
}: HomepagePopularDestinationsProps) {
  const displayCities = cities.slice(0, MAX_CITIES);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {displayCities.map((city) => {
        const isClickable = city.guideCount > 0;

        const card = (
          <div className="group relative overflow-hidden rounded-lg">
            <div className="relative aspect-[4/3] w-full">
              {city.coverImageUrl ? (
                <Image
                  src={city.coverImageUrl}
                  alt={city.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <span className="text-2xl text-muted-foreground">{city.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="p-2">
              <h3 className="font-medium text-sm">{city.name}</h3>
              <p className="text-xs text-muted-foreground">
                {city.guideCount > 0 ? `${city.guideCount} guides` : 'Coming soon'}
              </p>
            </div>
          </div>
        );

        if (isClickable) {
          return (
            <Link
              key={city.slug}
              href={`/guides?city=${city.slug}`}
              onClick={(e) => {
                if (onCityClick) {
                  e.preventDefault();
                  onCityClick(city.slug);
                }
              }}
            >
              {card}
            </Link>
          );
        }

        return <div key={city.slug}>{card}</div>;
      })}
    </div>
  );
}
