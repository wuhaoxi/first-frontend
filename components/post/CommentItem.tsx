'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CommentResponse } from '@/types/interactions';
import { formatRelativeTime } from '@/lib/time';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: CommentResponse;
  /** Resolved author name, or the "User #{id}" fallback */
  authorName: string;
  layer?: 1 | 2;
  currentUserId: number | null;
  onReplyClick: (comment: CommentResponse) => void;
  /** Returns an error message on failure, or null on success */
  onDelete: (commentId: number) => Promise<string | null>;
}

export default function CommentItem({
  comment,
  authorName,
  layer = 1,
  currentUserId,
  onReplyClick,
  onDelete,
}: CommentItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAuthor = currentUserId !== null && currentUserId === comment.userId;
  const showReplyButton = layer === 1 && currentUserId !== null;

  const handleDelete = async () => {
    if (deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const error = await onDelete(comment.id);
    if (error) {
      setDeleteError(error);
      setDeleting(false);
    }
    // On success the parent refreshes the list and this item unmounts.
  };

  return (
    <div className={cn('flex gap-3', layer === 2 && 'ml-10')}>
      <div
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
      >
        {authorName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-sm">
          <span className="font-medium text-foreground">{authorName}</span>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">
          {comment.content}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs">
          {showReplyButton && (
            <button
              type="button"
              className="font-medium text-muted-foreground hover:text-foreground"
              onClick={() => onReplyClick(comment)}
            >
              Reply
            </button>
          )}
          {isAuthor && (
            <button
              type="button"
              aria-label="Delete comment"
              disabled={deleting}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive disabled:opacity-60"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
          {deleteError && <span className="text-destructive">{deleteError}</span>}
          {layer === 2 && comment.replyCount > 0 && (
            <span className="text-muted-foreground">
              {comment.replyCount} replies hidden
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
