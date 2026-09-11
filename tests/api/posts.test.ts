import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPosts } from '@/lib/api/posts';
import type { PostListResponse } from '@/types/post';

const EMPTY_ENVELOPE: PostListResponse = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  nextCursor: null,
  hasMore: false,
};

describe('posts API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getPosts with no params sends GET /api/posts with no query string', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(EMPTY_ENVELOPE),
    });

    await getPosts();
    expect(fetch).toHaveBeenCalledWith('/api/posts', { credentials: 'include' });
  });

  it('getPosts appends only the defined query parameters', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(EMPTY_ENVELOPE),
    });

    await getPosts({ sort: 'upvotes', page: 1, size: 20 });
    expect(fetch).toHaveBeenCalledWith('/api/posts?sort=upvotes&page=1&size=20', {
      credentials: 'include',
    });

    await getPosts({ sort: 'latest' });
    expect(fetch).toHaveBeenLastCalledWith('/api/posts?sort=latest', { credentials: 'include' });
  });

  it('getPosts includes the opaque cursor', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(EMPTY_ENVELOPE),
    });

    const cursor = 'MjAyNi0wOS0wM1QwMDo0NTo0Ny42MzE4MzF8Mg';
    await getPosts({ sort: 'latest', size: 20, cursor });
    expect(fetch).toHaveBeenCalledWith(`/api/posts?sort=latest&size=20&cursor=${cursor}`, {
      credentials: 'include',
    });
  });

  it('getPosts returns the paginated envelope', async () => {
    const envelope: PostListResponse = {
      content: [
        {
          id: 2,
          title: 'Second post',
          coverImage: null,
          tags: ['travel'],
          authorId: 1,
          commentCount: 2,
          upVoteCount: 5,
          bookmarkCount: 1,
          createdAt: '2026-09-03T00:45:47.631831',
          updatedAt: '2026-09-03T00:45:47.631831',
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      nextCursor: null,
      hasMore: false,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(envelope),
    });

    const result = await getPosts({ sort: 'latest', page: 0, size: 20 });
    expect(result).toEqual(envelope);
    expect(result.content[0].upVoteCount).toBe(5);
    expect(result.content[0].bookmarkCount).toBe(1);
  });

  it('getPosts throws formatted error on non-OK response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ message: 'Invalid size' }),
    });

    await expect(getPosts({ size: 0 })).rejects.toThrow('400: Invalid size');
  });
});
