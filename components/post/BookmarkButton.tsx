'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { toggleBookmark } from '@/lib/api/interactions';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  postId: number;
  bookmarked: boolean | null;
}

export default function BookmarkButton({ postId, bookmarked }: BookmarkButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(bookmarked === true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (pending) {
      return;
    }
    setError(null);
    const snapshot = isBookmarked;
    setIsBookmarked(!snapshot);
    setPending(true);

    const res = await toggleBookmark(postId);
    if (res.ok && res.data) {
      setIsBookmarked(res.data.bookmarked);
    } else {
      setIsBookmarked(snapshot);
      setError(res.message ?? 'Failed to update bookmark');
    }
    setPending(false);
  };

  const Icon = isBookmarked ? BookmarkCheck : Bookmark;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        aria-pressed={isBookmarked}
        disabled={pending}
        onClick={handleToggle}
        className={cn(
          'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
          isBookmarked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-muted-foreground hover:bg-muted',
          pending && 'cursor-not-allowed opacity-60'
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
