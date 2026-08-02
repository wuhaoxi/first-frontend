'use client';

import { Skeleton } from '@/components/ui/skeleton';

export type SkeletonVariant = 'hero' | 'grid' | 'list' | 'banner';

interface SectionSkeletonProps {
  variant: SkeletonVariant;
  itemCount?: number;
}

function clampItemCount(count: number): number {
  return Math.max(1, Math.min(12, count));
}

function getDefaultItemCount(variant: SkeletonVariant): number {
  switch (variant) {
    case 'hero':
      return 1;
    case 'grid':
      return 6;
    case 'list':
      return 5;
    case 'banner':
      return 1;
  }
}

export function SectionSkeleton({ variant, itemCount }: SectionSkeletonProps) {
  const count = clampItemCount(itemCount ?? getDefaultItemCount(variant));

  const heroItem = <Skeleton data-skeleton className="h-64 w-full rounded-xl" />;
  const gridItem = <Skeleton data-skeleton className="aspect-[4/3] w-full rounded-lg" />;
  const listItem = <Skeleton data-skeleton className="h-16 w-full rounded-md" />;
  const bannerItem = <Skeleton data-skeleton className="h-40 w-full rounded-lg" />;

  const getItem = () => {
    switch (variant) {
      case 'hero':
        return heroItem;
      case 'grid':
        return gridItem;
      case 'list':
        return listItem;
      case 'banner':
        return bannerItem;
    }
  };

  const item = getItem();

  return (
    <div
      className={
        variant === 'grid'
          ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'
          : 'flex flex-col gap-3'
      }
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{item}</div>
      ))}
    </div>
  );
}
