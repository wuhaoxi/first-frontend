'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { PostCard } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getPosts } from '@/lib/api/posts';
import { cn } from '@/lib/utils';
import type { PostSort, PostSummary } from '@/types/post';

const PAGE_SIZE = 20;

const SORT_TABS: { value: PostSort; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'upvotes', label: 'Most Liked' },
  { value: 'comments', label: 'Most Commented' },
];

const SKELETON_KEYS = [1, 2, 3];

function PostCardSkeletonCard() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export default function PostsPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [sort, setSort] = useState<PostSort>('latest');
  const [page, setPage] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const generationRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchFirstPage = useCallback((nextSort: PostSort) => {
    const generation = ++generationRef.current;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setLoadMoreError(null);
    getPosts({ sort: nextSort, page: 0, size: PAGE_SIZE })
      .then((res) => {
        if (generationRef.current !== generation) {
          return;
        }
        setPosts(res.content);
        setPage(res.page);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch((err) => {
        if (generationRef.current !== generation) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      })
      .finally(() => {
        if (generationRef.current === generation) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    fetchFirstPage('latest');
  }, [fetchFirstPage]);

  const handleSortChange = (nextSort: PostSort) => {
    if (nextSort === sort) {
      return;
    }
    setSort(nextSort);
    setPage(0);
    setNextCursor(null);
    setHasMore(false);
    fetchFirstPage(nextSort);
  };

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    const generation = generationRef.current;
    setLoadingMore(true);
    setLoadMoreError(null);
    const request =
      sort === 'latest' && nextCursor
        ? getPosts({ sort: 'latest', size: PAGE_SIZE, cursor: nextCursor })
        : getPosts({ sort, page: page + 1, size: PAGE_SIZE });
    request
      .then((res) => {
        if (generationRef.current !== generation) {
          return;
        }
        setPosts((prev) => {
          const existingIds = new Set(prev.map((post) => post.id));
          const fresh = res.content.filter((post) => !existingIds.has(post.id));
          return [...prev, ...fresh];
        });
        setPage(res.page);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch((err) => {
        if (generationRef.current !== generation) {
          return;
        }
        setLoadMoreError(err instanceof Error ? err.message : 'Failed to load more posts');
      })
      .finally(() => {
        if (generationRef.current === generation) {
          setLoadingMore(false);
        }
      });
  }, [loading, loadingMore, hasMore, sort, nextCursor, page]);

  const observerEligible =
    !loading && !loadingMore && hasMore && !error && !loadMoreError && posts.length > 0;

  useEffect(() => {
    if (!observerEligible) {
      return;
    }
    const node = sentinelRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [observerEligible, loadMore]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        {user ? (
          <Link
            href="/posts/create"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            New Post
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-primary underline hover:opacity-80"
          >
            Log in to post
          </Link>
        )}
      </div>

      {/* Sort tabs */}
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Sort posts">
        {SORT_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={sort === tab.value}
            onClick={() => handleSortChange(tab.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              sort === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'border text-muted-foreground hover:bg-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SKELETON_KEYS.map((key) => (
            <PostCardSkeletonCard key={key} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-12">
          <p className="mb-4 text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchFirstPage(sort)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="mb-4 text-muted-foreground">
            No posts yet. Be the first to share a story!
          </p>
          <Link
            href="/posts/create"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Create a Post
          </Link>
        </div>
      )}

      {/* Post grid */}
      {!loading && !error && posts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {loadingMore &&
            SKELETON_KEYS.map((key) => <PostCardSkeletonCard key={`skeleton-${key}`} />)}
        </div>
      )}

      {/* Auto-load sentinel */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* Load-more error */}
      {!loading && !error && loadMoreError && (
        <div className="mt-8 text-center">
          <p className="mb-3 text-sm text-destructive" role="alert">
            {loadMoreError}
          </p>
          <button
            type="button"
            onClick={loadMore}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Retry
          </button>
        </div>
      )}

      {/* End of list */}
      {!loading && !error && posts.length > 0 && !hasMore && (
        <p className="mt-8 text-center text-sm text-muted-foreground">You&apos;ve reached the end</p>
      )}
    </div>
  );
}
