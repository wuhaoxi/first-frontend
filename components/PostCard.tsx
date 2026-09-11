'use client';

import Link from 'next/link';
import { Bookmark, ImageIcon, MessageCircle, ThumbsUp } from 'lucide-react';
import type { PostSummary } from '@/types/post';
import { formatRelativeTime } from '@/lib/time';

export function PostCard({ post }: { post: PostSummary }) {
  const truncatedTitle =
    post.title.length > 80 ? post.title.slice(0, 80) + '...' : post.title;

  const displayTags = post.tags.slice(0, 3);

  return (
    <Link
      href={`/posts/${post.id}`}
      className="group block rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover image */}
      <div className="h-48 w-full overflow-hidden rounded-t-lg bg-muted">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold leading-snug group-hover:text-primary">
          {truncatedTitle}
        </h3>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" aria-label="Upvotes">
            <ThumbsUp className="h-3 w-3" />
            {post.upVoteCount}
          </span>
          <span className="flex items-center gap-1" aria-label="Comments">
            <MessageCircle className="h-3 w-3" />
            {post.commentCount}
          </span>
          <span className="flex items-center gap-1" aria-label="Bookmarks">
            <Bookmark className="h-3 w-3" />
            {post.bookmarkCount}
          </span>
          <span>{formatRelativeTime(post.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
