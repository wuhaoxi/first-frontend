'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 2000;

interface CommentInputProps {
  /** Posts a comment; resolves an error message on failure or null on success */
  onSubmit: (content: string) => Promise<string | null>;
  replyToName?: string | null;
  onCancelReply?: () => void;
}

export default function CommentInput({ onSubmit, replyToName = null, onCancelReply }: CommentInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !pending;

  if (!user) {
    return (
      <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>{' '}
        to join the discussion.
      </p>
    );
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    setPending(true);
    setError(null);
    const submitError = await onSubmit(trimmed);
    if (submitError) {
      setError(submitError);
    } else {
      setContent('');
    }
    setPending(false);
  };

  return (
    <div className="space-y-2">
      {replyToName && (
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <span>
            Replying to <span className="font-medium text-foreground">{replyToName}</span>
          </span>
          <button
            type="button"
            aria-label="Cancel reply"
            disabled={pending}
            onClick={onCancelReply}
            className="inline-flex items-center gap-1 hover:text-foreground disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <textarea
        value={content}
        maxLength={MAX_LENGTH}
        disabled={pending}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            void handleSubmit();
          }
        }}
        placeholder="Write a comment…"
        rows={3}
        className={cn(
          'w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'
        )}
      />
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs tabular-nums',
            content.length === MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {content.length}/{MAX_LENGTH}
        </span>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Post
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
