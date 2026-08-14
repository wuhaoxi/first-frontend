'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { getPostById } from '@/lib/api/posts';
import { formatRelativeTime } from '@/lib/time';
import type { PostResponse } from '@/types/post';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();

  const [post, setPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPostById(Number(params.id))
      .then(setPost)
      .catch((err) => setError(err instanceof Error ? err.message : 'Post not found'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Post not found</h1>
        <p className="mb-6 text-muted-foreground">
          {error || 'This post may have been removed or is not available.'}
        </p>
        <Link
          href="/posts"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Back to Posts
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.authorId;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Cover image */}
      {post.coverImage ? (
        <img
          src={post.coverImage}
          alt={post.title}
          className="mb-8 h-96 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="mb-8 flex h-48 w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
          No cover image
        </div>
      )}

      {/* Title */}
      <h1 className="mb-4 text-3xl font-bold">{post.title}</h1>

      {/* Meta */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>Author #{post.authorId}</span>
        <span>Comments: {post.commentCount}</span>
        <span>{formatRelativeTime(post.createdAt)}</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {post.status}
        </span>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Edit button for author */}
      {isAuthor && (
        <div className="mb-6">
          <Link
            href={`/posts/${post.id}/edit`}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Edit
          </Link>
        </div>
      )}

      {/* Markdown content */}
      <div className="prose max-w-none" data-color-mode="light">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
      </div>

      {/* Timestamps */}
      <div className="mt-8 border-t pt-4 text-xs text-muted-foreground">
        <p>Created: {new Date(post.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(post.updatedAt).toLocaleString()}</p>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/posts"
          className="text-sm text-primary underline hover:opacity-80"
        >
          ← Back to Posts
        </Link>
      </div>
    </div>
  );
}

// Simple client-side Markdown renderer (avoids pulling in react-markdown for a single page)
function renderMarkdown(md: string): string {
  let html = md
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="max-w-full rounded-lg" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-muted pl-4 italic">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4" />')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>[\s\S]*?<\/li>)\n(<li>)/g, '$1$2');

  // Wrap paragraphs (lines that aren't already HTML tags)
  html = html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return html;
}
