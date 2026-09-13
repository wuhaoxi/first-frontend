'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  Hourglass,
  MapPin,
  Ticket,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAttractionBySlug } from '@/lib/api/attractions';
import { CATEGORY_LABELS } from '@/lib/attraction-meta';
import type { AttractionResponse } from '@/types/attraction';

function DetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="attraction-detail-skeleton">
      <Skeleton className="aspect-[21/9] w-full rounded-lg" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="text-sm">{value}</dd>
      </div>
    </div>
  );
}

export default function AttractionDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [attraction, setAttraction] = useState<AttractionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttraction = useCallback(() => {
    setLoading(true);
    setError(null);
    getAttractionBySlug(slug)
      .then((res) => {
        setAttraction(res);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load attraction');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    fetchAttraction();
  }, [fetchAttraction]);

  const isNotFound = error !== null && error.startsWith('404');

  const backLink = (
    <Link
      href="/attractions"
      className="inline-flex items-center gap-1 text-sm text-primary underline hover:opacity-80"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to attractions
    </Link>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {loading && (
        <>
          <div className="mb-6">{backLink}</div>
          <DetailSkeleton />
        </>
      )}

      {!loading && isNotFound && (
        <div className="py-12 text-center">
          <h1 className="mb-3 text-2xl font-bold">Attraction not found</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          {backLink}
        </div>
      )}

      {!loading && error && !isNotFound && (
        <div className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">{error}</p>
          <div className="mb-6">
            <button
              onClick={fetchAttraction}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Retry
            </button>
          </div>
          {backLink}
        </div>
      )}

      {!loading && !error && attraction && (
        <article className="space-y-6">
          <div>{backLink}</div>

          {/* Hero */}
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg bg-muted">
            {attraction.coverImageUrl ? (
              <Image
                src={attraction.coverImageUrl}
                alt={attraction.name}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                priority
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-medium text-muted-foreground">
                  {attraction.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <header>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-3xl font-bold">{attraction.name}</h1>
              <p className="text-xl text-muted-foreground">{attraction.nameZh}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{CATEGORY_LABELS[attraction.category]}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {attraction.province && attraction.province !== attraction.city
                  ? `${attraction.city}, ${attraction.province}`
                  : attraction.city}
              </span>
            </div>
            {attraction.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {attraction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Summary + description */}
          <section className="space-y-3">
            <p className="text-lg text-muted-foreground">{attraction.summary}</p>
            <p>{attraction.description}</p>
          </section>

          {/* Advance booking alert */}
          {attraction.bookingRequired && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900"
            >
              <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Advance booking required</p>
                <p className="text-sm">
                  {attraction.bookingNote ?? 'Book ahead of your visit'}
                </p>
              </div>
            </div>
          )}

          {/* Practical info */}
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 text-lg font-semibold">Practical information</h2>
            <dl className="divide-y">
              {attraction.openingHours && (
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Opening hours"
                  value={attraction.openingHours}
                />
              )}
              {attraction.ticketPrice && (
                <InfoRow
                  icon={<Ticket className="h-4 w-4" />}
                  label="Ticket price"
                  value={attraction.ticketPrice}
                />
              )}
              {attraction.suggestedDuration && (
                <InfoRow
                  icon={<Hourglass className="h-4 w-4" />}
                  label="Suggested duration"
                  value={attraction.suggestedDuration}
                />
              )}
              {attraction.address && (
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Address"
                  value={attraction.address}
                />
              )}
            </dl>
            {attraction.latitude !== null && attraction.longitude !== null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline hover:opacity-80"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Open in map
              </a>
            )}
          </section>
        </article>
      )}
    </div>
  );
}
