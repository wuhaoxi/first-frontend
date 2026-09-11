'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { PostCard } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getPosts } from '@/lib/api/posts';
import type { PostSort, PostSummary } from '@/types/post';

const PAGE_SIZE = 20;

const SORT_TABS: { value: PostSort; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'upvotes', label: 'Most Liked' },
  { value: 'comments', label: 'Most Commented' },
];

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

  const fetchFirstPage = (nextSort: PostSort) => {
    setLoading(true);
    setError(null);
    setLoadMoreError(null);
    getPosts({ sort: nextSort, page: 0, size: PAGE_SIZE })
      .then((res) => {
        setPosts(res.content);
        setPage(res.page);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load posts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFirstPage('latest');
  }, []);

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

  const handleLoadMore = () => {
    setLoadingMore(true);
    setLoadMoreError(null);
    const request =
      sort === 'latest' && nextCursor
        ? getPosts({ sort: 'latest', size: PAGE_SIZE, cursor: nextCursor })
        : getPosts({ sort, page: page + 1, size: PAGE_SIZE });
    request
      .then((res) => {
        setPosts((prev) => [...prev, ...res.content]);
        setPage(res.page);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch((err) =>
        setLoadMoreError(err instanceof Error ? err.message : 'Failed to load more posts')
      )
      .finally(() => setLoadingMore(false));
  };

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
            className={
              sort === tab.value
                ? 'rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                : 'rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
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
        </div>
      )}

      {/* Load more */}
      {!loading && !error && hasMore && (
        <div className="mt-8 text-center">
          {loadMoreError && <p className="mb-3 text-sm text-destructive">{loadMoreError}</p>}
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
