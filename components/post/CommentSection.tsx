'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import CommentInput from '@/components/post/CommentInput';
import CommentList, { CommentThread } from '@/components/post/CommentList';
import {
  getTopLevelComments,
  getReplies,
  createComment,
  createReply,
  deleteComment,
} from '@/lib/api/interactions';
import { getUserById } from '@/lib/api/users';
import type { CommentResponse } from '@/types/interactions';

const PAGE_SIZE = 20;

interface CommentSectionProps {
  postId: number;
  commentCount: number;
  /** Called after any successful comment mutation so the page can refresh post meta */
  onCommentMutated: () => void;
}

export default function CommentSection({ postId, commentCount, onCommentMutated }: CommentSectionProps) {
  const { user } = useAuth();

  const [topItems, setTopItems] = useState<CommentResponse[]>([]);
  const [topTotalElements, setTopTotalElements] = useState(0);
  const [topTotalPages, setTopTotalPages] = useState(0);
  const [topPage, setTopPage] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMoreTop, setLoadingMoreTop] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [threads, setThreads] = useState<Map<number, CommentThread>>(new Map());
  const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());

  const [names, setNames] = useState<Map<number, string>>(new Map());
  const namesRef = useRef<Map<number, string>>(new Map());

  const [replyingTo, setReplyingTo] = useState<CommentResponse | null>(null);

  const mergeNames = useCallback((idsToFetch: number[]) => {
    const missing = Array.from(new Set(idsToFetch)).filter((id) => !namesRef.current.has(id));
    if (missing.length === 0) {
      return;
    }
    missing.forEach(async (userId) => {
      try {
        const fetched = await getUserById(userId);
        namesRef.current.set(userId, fetched.name);
        setNames(new Map(namesRef.current));
      } catch {
        // Fallback: renderers display `User #{userId}` until namesRef has the entry.
      }
    });
  }, []);

  const loadThreadsFor = useCallback(
    async (parents: CommentResponse[]) => {
      const toLoad = parents.filter((c) => c.replyCount > 0);
      if (toLoad.length === 0) {
        return;
      }
      const parentIds = toLoad.map((c) => c.id);
      setLoadingReplies((prev) => {
        const next = new Set(prev);
        parentIds.forEach((id) => next.add(id));
        return next;
      });

      const settled = await Promise.allSettled(toLoad.map((c) => getReplies(c.id, 0, PAGE_SIZE)));

      setThreads((prev) => {
        const next = new Map(prev);
        settled.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value?.ok && result.value.data) {
            next.set(toLoad[index].id, {
              items: result.value.data.content,
              page: result.value.data.page,
              totalPages: result.value.data.totalPages,
            });
          }
        });
        return next;
      });
      setLoadingReplies((prev) => {
        const next = new Set(prev);
        parentIds.forEach((id) => next.delete(id));
        return next;
      });

      const allFetched = settled.flatMap((result, index) =>
        result.status === 'fulfilled' && result.value?.ok && result.value.data
          ? [toLoad[index], ...result.value.data.content]
          : []
      );
      mergeNames(allFetched.map((c) => c.userId));
    },
    [mergeNames]
  );

  const refreshAll = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(null);
    try {
      const res = await getTopLevelComments(postId, 0, PAGE_SIZE);
      if (!res.ok || !res.data) {
        setLoadError(res?.message ?? 'Failed to load comments');
        return;
      }
      const data = res.data;
      setTopItems(data.content);
      setTopTotalElements(data.totalElements);
      setTopTotalPages(data.totalPages);
      setTopPage(0);
      setReplyingTo(null);
      mergeNames(data.content.map((c) => c.userId));
      await loadThreadsFor(data.content);
    } catch {
      setLoadError('Failed to load comments');
    } finally {
      setInitialLoading(false);
    }
  }, [postId, mergeNames, loadThreadsFor]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const loadMoreTop = async () => {
    if (loadingMoreTop || topPage + 1 >= topTotalPages) {
      return;
    }
    setLoadingMoreTop(true);
    try {
      const res = await getTopLevelComments(postId, topPage + 1, PAGE_SIZE);
      if (!res.ok || !res.data) {
        return;
      }
      const data = res.data;
      setTopItems((prev) => [...prev, ...data.content]);
      setTopPage(topPage + 1);
      mergeNames(data.content.map((c) => c.userId));
      await loadThreadsFor(data.content);
    } catch {
      // Keep current items; the button is re-enabled via finally.
    } finally {
      setLoadingMoreTop(false);
    }
  };

  const loadMoreReplies = async (parentId: number) => {
    const thread = threads.get(parentId);
    if (!thread || loadingReplies.has(parentId) || thread.page + 1 >= thread.totalPages) {
      return;
    }
    setLoadingReplies((prev) => new Set(prev).add(parentId));
    try {
      const res = await getReplies(parentId, thread.page + 1, PAGE_SIZE);
      if (!res.ok || !res.data) {
        return;
      }
      const data = res.data;
      setThreads((prev) => {
        const next = new Map(prev);
        const current = next.get(parentId);
        if (current) {
          next.set(parentId, {
            items: [...current.items, ...data.content],
            page: data.page,
            totalPages: data.totalPages,
          });
        }
        return next;
      });
      mergeNames(data.content.map((c) => c.userId));
    } catch {
      // Keep the current thread; the button becomes available again via finally.
    } finally {
      setLoadingReplies((prev) => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  };

  const handleSubmit = async (content: string): Promise<string | null> => {
    const res = replyingTo
      ? await createReply(replyingTo.id, content)
      : await createComment(postId, content);
    if (!res.ok) {
      return res.message ?? 'Failed to post';
    }
    onCommentMutated();
    await refreshAll();
    return null;
  };

  const handleDelete = async (commentId: number): Promise<string | null> => {
    const res = await deleteComment(commentId);
    if (!res.ok) {
      return res.message ?? 'Failed to delete comment';
    }
    onCommentMutated();
    await refreshAll();
    return null;
  };

  const handleReplyClick = (comment: CommentResponse) => {
    setReplyingTo(comment);
  };

  const showList = !initialLoading && !loadError && topTotalElements > 0;

  return (
    <section className="space-y-6" aria-label="Comments">
      <h2 className="text-lg font-semibold text-foreground">Comments ({commentCount})</h2>

      {initialLoading && (
        <div data-testid="comments-skeleton" className="space-y-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!initialLoading && loadError && (
        <div className="flex flex-col items-center gap-3 rounded-md border border-destructive/40 p-6 text-sm text-destructive">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Retry
          </button>
        </div>
      )}

      {!initialLoading && !loadError && topItems.length === 0 && (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}

      {showList && (
        <CommentList
          comments={topItems}
          threads={threads}
          names={names}
          currentUserId={user ? user.id : null}
          hasMoreTop={topPage + 1 < topTotalPages}
          loadingMoreTop={loadingMoreTop}
          onLoadMoreTop={() => void loadMoreTop()}
          onLoadMoreReplies={(parentId) => void loadMoreReplies(parentId)}
          onReplyClick={handleReplyClick}
          onDelete={handleDelete}
        />
      )}

      <CommentInput
        onSubmit={handleSubmit}
        replyToName={replyingTo ? names.get(replyingTo.userId) ?? `User #${replyingTo.userId}` : null}
        onCancelReply={() => setReplyingTo(null)}
      />
    </section>
  );
}
