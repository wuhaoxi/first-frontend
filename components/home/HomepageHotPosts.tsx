'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import type { HotPost } from '@/types/home';
import { formatRelativeTime } from '@/lib/time';

interface HomepageHotPostsProps {
  posts: HotPost[];
  onPostClick?: (id: number) => void;
  now?: Date;
}

export function HomepageHotPosts({
  posts,
  onPostClick,
  now,
}: HomepageHotPostsProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-muted-foreground">No discussions yet</p>
        <Link
          href="/community/new"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Start a Discussion &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {posts.slice(0, 5).map((post) => (
        <Link
          key={post.id}
          href={`/community/post/${post.id}`}
          onClick={(e) => {
            if (onPostClick) {
              e.preventDefault();
              onPostClick(post.id);
            }
          }}
          className="flex items-center gap-3 py-3 hover:bg-accent/50 rounded-md px-2 -mx-2 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-1">{post.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {post.cityName && (
                <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs">
                  {post.cityName}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <MessageCircle className="h-3 w-3" />
                {post.commentCount} comments
              </span>
              <span>{formatRelativeTime(post.createdAt, now)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
