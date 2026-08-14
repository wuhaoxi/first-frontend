'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MDEditor from '@uiw/react-md-editor';
import { useAuth } from '@/components/AuthContext';
import { getPostById, createPost, updatePost } from '@/lib/api/posts';
import type { PostStatus, CreatePostRequest, UpdatePostRequest } from '@/types/post';

export function PostForm({ id }: { id?: string }) {
  const isEditMode = Boolean(id);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<PostStatus>('DRAFT');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Load existing post in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      setInitialLoading(true);
      getPostById(Number(id))
        .then((post) => {
          setTitle(post.title);
          setContent(post.content);
          setCoverImage(post.coverImage || '');
          setTagsInput(post.tags.join(', '));
          setStatus(post.status);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load post');
        })
        .finally(() => setInitialLoading(false));
    }
  }, [id, isEditMode]);

  const parseTags = (input: string): string[] => {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const tags = parseTags(tagsInput);

    try {
      if (isEditMode && id) {
        const data: UpdatePostRequest = {
          title,
          content,
          tags,
          coverImage: coverImage || undefined,
          status,
        };
        const updated = await updatePost(Number(id), data);
        router.push(`/posts/${updated.id}`);
      } else {
        const data: CreatePostRequest = {
          title,
          content,
          tags,
          coverImage: coverImage || undefined,
          status,
        };
        const created = await createPost(data);
        router.push(`/posts/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
      setSaving(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || initialLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
          <div className="h-96 w-full rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">
        {isEditMode ? 'Edit Post' : 'New Post'}
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Give your post a title"
          />
        </div>

        {/* Content — Markdown editor */}
        <div>
          <label className="mb-1 block text-sm font-medium">Content *</label>
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(val: string | undefined) => setContent(val || '')}
              height={400}
              preview="live"
            />
          </div>
        </div>

        {/* Cover Image URL */}
        <div>
          <label htmlFor="coverImage" className="mb-1 block text-sm font-medium">
            Cover Image URL
          </label>
          <input
            id="coverImage"
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="https://example.com/photo.jpg"
          />
          {coverImage && (
            <img
              src={coverImage}
              alt="Cover preview"
              className="mt-2 h-32 w-auto rounded-lg border object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="mb-1 block text-sm font-medium">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g. travel, food, guide"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => router.push(id ? `/posts/${id}` : '/posts')}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
