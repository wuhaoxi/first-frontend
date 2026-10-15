import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHotPosts } from '@/lib/api/home';
import type { HotPost } from '@/types/home';

const mockPost: HotPost = {
  id: 1,
  title: 'Best hot pot places in Chengdu?',
  cityName: 'Chengdu',
  commentCount: 42,
  createdAt: '2026-08-01T12:00:00Z',
};

describe('home API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- getHotPosts ---

  it('getHotPosts returns posts on success', async () => {
    const posts: HotPost[] = [mockPost];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(posts),
    });

    const result = await getHotPosts();
    expect(result).toEqual(posts);
    expect(fetch).toHaveBeenCalledWith('/api/home/hot-posts', { cache: 'no-store' });
  });

  it('getHotPosts throws on non-OK', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: () => Promise.resolve({}),
    });

    await expect(getHotPosts()).rejects.toThrow('503: Service Unavailable');
  });

  it('getHotPosts returns empty array on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    const result = await getHotPosts();
    expect(result).toEqual([]);
  });
});
