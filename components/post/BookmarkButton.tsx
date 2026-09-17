'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkCheck, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import type { ApiResponse } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  /** Current active state (null when unknown, e.g. for anonymous visitors) */
  active: boolean | null;
  /** Executes the toggle; resolves the new active state */
  toggle: () => Promise<ApiResponse<boolean>>;
  /** Accessible labels; default "Bookmark" / "Remove bookmark" */
  labels?: { add: string; remove: string };
  /** Lucide icons; default Bookmark / BookmarkCheck */
  icon?: LucideIcon;
  activeIcon?: LucideIcon;
  /** Called with the reconciled state after a successful toggle */
  onChanged?: (active: boolean) => void;
}

export default function BookmarkButton({
  active,
  toggle,
  labels = { add: 'Bookmark', remove: 'Remove bookmark' },
  icon: InactiveIcon = Bookmark,
  activeIcon: ActiveIcon = BookmarkCheck,
  onChanged,
}: BookmarkButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(active === true);
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
    const snapshot = isActive;
    setIsActive(!snapshot);
    setPending(true);

    const res = await toggle();
    if (res.ok && res.data !== null) {
      setIsActive(res.data);
      onChanged?.(res.data);
    } else {
      setIsActive(snapshot);
      setError(res.message ?? 'Failed to update bookmark');
    }
    setPending(false);
  };

  const Icon = isActive ? ActiveIcon : InactiveIcon;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={isActive ? labels.remove : labels.add}
        aria-pressed={isActive}
        disabled={pending}
        onClick={handleToggle}
        className={cn(
          'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
          isActive
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
