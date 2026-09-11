'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { getVoteStats, castVote } from '@/lib/api/interactions';
import type { VoteType, VoteStatsResponse } from '@/types/interactions';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  postId: number;
}

function optimisticNext(stats: VoteStatsResponse, clicked: VoteType): VoteStatsResponse {
  const { upCount, downCount, userVote } = stats;
  if (userVote === clicked) {
    return {
      upCount: clicked === 'UP' ? upCount - 1 : upCount,
      downCount: clicked === 'DOWN' ? downCount - 1 : downCount,
      userVote: null,
    };
  }
  if (userVote === null) {
    return {
      upCount: clicked === 'UP' ? upCount + 1 : upCount,
      downCount: clicked === 'DOWN' ? downCount + 1 : downCount,
      userVote: clicked,
    };
  }
  return {
    upCount: clicked === 'UP' ? upCount + 1 : upCount - 1,
    downCount: clicked === 'DOWN' ? downCount + 1 : downCount - 1,
    userVote: clicked,
  };
}

export default function VoteButtons({ postId }: VoteButtonsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<VoteStatsResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVoteStats(postId).then((res) => {
      if (!cancelled && res.ok && res.data) {
        setStats(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleVote = async (voteType: VoteType) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (pending || !stats) {
      return;
    }
    setError(null);
    const snapshot = stats;
    setStats(optimisticNext(stats, voteType));
    setPending(true);

    const res = await castVote(postId, voteType);
    if (res.ok && res.data) {
      setStats(res.data);
    } else {
      setStats(snapshot);
      setError(res.message ?? 'Failed to vote');
    }
    setPending(false);
  };

  const disabled = pending || !stats;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Vote up"
        aria-pressed={stats?.userVote === 'UP'}
        disabled={disabled}
        onClick={() => handleVote('UP')}
        className={cn(
          'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
          stats?.userVote === 'UP'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-muted-foreground hover:bg-muted',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        👍 {stats?.upCount ?? 0}
      </button>
      <button
        type="button"
        aria-label="Vote down"
        aria-pressed={stats?.userVote === 'DOWN'}
        disabled={disabled}
        onClick={() => handleVote('DOWN')}
        className={cn(
          'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
          stats?.userVote === 'DOWN'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-muted-foreground hover:bg-muted',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        👎 {stats?.downCount ?? 0}
      </button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
