'use client';

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
  children,
  className,
}: SectionContainerProps) {
  let content: React.ReactNode;

  switch (state.status) {
    case 'loading':
      content = <SectionSkeleton variant={sectionIdToSkeletonVariant(id)} />;
      break;
    case 'error':
      content = (
        <SectionError
          message={state.message}
          onRetry={onRetry ?? (() => {})}
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
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {content}
    </section>
  );
}
