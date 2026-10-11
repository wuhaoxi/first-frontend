'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import type { SectionId, SectionState } from '@/types/home';
import { SectionSkeleton } from './SectionSkeleton';
import { SectionError } from './SectionError';
import type { SkeletonVariant } from './SectionSkeleton';

type AllowedState = SectionState<unknown>;

interface SectionContainerProps {
  id: SectionId;
  title?: string;
  state: AllowedState;
  onRetry?: () => void;
  action?: { label: string; href: string };
  children?: React.ReactNode;
  className?: string;
}

function sectionIdToSkeletonVariant(id: SectionId): SkeletonVariant {
  switch (id) {
    case 'editors-picks':
      return 'hero';
    case 'popular-destinations':
      return 'grid';
    case 'hot-posts':
      return 'list';
    case 'search-entry':
    case 'function-navigation':
    case 'ai-assistant-entry':
    default:
      return 'banner';
  }
}

export function SectionContainer({
  id,
  title,
  state,
  onRetry,
  action,
  children,
  className,
}: SectionContainerProps) {
  const router = useRouter();
  let content: React.ReactNode;

  switch (state.status) {
    case 'loading':
      content = <SectionSkeleton variant={sectionIdToSkeletonVariant(id)} />;
      break;
    case 'error':
      content = (
        <SectionError
          message={state.message}
          onRetry={onRetry ?? (() => router.refresh())}
        />
      );
      break;
    case 'success':
      content = children;
      break;
    case 'idle':
    default:
      content = children;
      break;
  }

  return (
    <section id={id} className={className}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
          {action && (
            <Link
              href={action.href}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary"
            >
              {action.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
      {content}
    </section>
  );
}
