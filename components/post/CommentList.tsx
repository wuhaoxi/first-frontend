'use client';

import CommentItem from '@/components/post/CommentItem';
import type { CommentView } from '@/types/interactions';

export interface CommentThread {
  items: CommentView[];
  page: number;
  totalPages: number;
}

interface CommentListProps {
  comments: CommentView[];
  threads: Map<number, CommentThread>;
  names: Map<number, string>;
  currentUserId: number | null;
  hasMoreTop: boolean;
  loadingMoreTop: boolean;
  onLoadMoreTop: () => void;
  onLoadMoreReplies: (parentId: number) => void;
  onReplyClick: (comment: CommentView) => void;
  onDelete: (commentId: number) => Promise<string | null>;
}

export default function CommentList({
  comments,
  threads,
  names,
  currentUserId,
  hasMoreTop,
  loadingMoreTop,
  onLoadMoreTop,
  onLoadMoreReplies,
  onReplyClick,
  onDelete,
}: CommentListProps) {
  const authorNameOf = (userId: number) => names.get(userId) ?? `User #${userId}`;

  return (
    <div className="space-y-5">
      {comments.map((top) => {
        const thread = threads.get(top.id);
        const loadingReplies = top.replyCount > 0 && !thread;
        const hasMoreReplies = thread !== undefined && thread.page + 1 < thread.totalPages;

        return (
          <div key={top.id} className="space-y-2">
            <CommentItem
              comment={top}
              authorName={authorNameOf(top.userId)}
              layer={1}
              currentUserId={currentUserId}
              onReplyClick={onReplyClick}
              onDelete={onDelete}
            />
            {top.replyCount > 0 && (
              <div className="ml-6 space-y-3 border-l border-border pl-4">
                {thread?.items.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    authorName={authorNameOf(reply.userId)}
                    layer={2}
                    currentUserId={currentUserId}
                    onReplyClick={onReplyClick}
                    onDelete={onDelete}
                  />
                ))}
                {hasMoreReplies && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => onLoadMoreReplies(top.id)}
                  >
                    Load more replies
                  </button>
                )}
                {loadingReplies && (
                  <div className="animate-pulse text-xs text-muted-foreground">Loading replies…</div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {hasMoreTop && (
        <button
          type="button"
          disabled={loadingMoreTop}
          className="w-full rounded-md border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onLoadMoreTop}
        >
          {loadingMoreTop ? 'Loading…' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}
