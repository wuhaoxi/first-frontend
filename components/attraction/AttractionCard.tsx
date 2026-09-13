'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarCheck } from 'lucide-react';
import type { AttractionSummary } from '@/types/attraction';
import { CATEGORY_LABELS } from '@/lib/attraction-meta';
import { cn } from '@/lib/utils';

export function AttractionCard({ attraction }: { attraction: AttractionSummary }) {
  return (
    <Link
      href={`/attractions/${attraction.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover image */}
      <div className="relative aspect-[4/3] w-full bg-muted">
        {attraction.coverImageUrl ? (
          <Image
            src={attraction.coverImageUrl}
            alt={attraction.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-medium text-muted-foreground">
              {attraction.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold leading-snug group-hover:text-primary">
              {attraction.name}
            </h3>
            <p className="text-xs text-muted-foreground">{attraction.nameZh}</p>
          </div>
          {attraction.bookingRequired && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground'
              )}
            >
              <CalendarCheck className="h-3 w-3" />
              Booking required
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          <span>{attraction.city}</span>
          <span aria-hidden="true"> · </span>
          <span>{CATEGORY_LABELS[attraction.category]}</span>
        </p>

        <p className="line-clamp-2 text-sm text-muted-foreground">{attraction.summary}</p>
      </div>
    </Link>
  );
}
