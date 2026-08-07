import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFeaturedGuides, getPopularDestinations, getHotPosts } from '@/lib/api/home';
import type { FeaturedGuide, PopularCity, HotPost } from '@/types/home';

const mockGuide: FeaturedGuide = {
  id: 1,
  title: 'A Guide to Chengdu',
  cityName: 'Chengdu',
  coverImageUrl: 'https://example.com/chengdu.jpg',
  recommendation: 'Best spicy food tour',
  slug: 'chengdu-guide',
};

const mockCity: PopularCity = {
  slug: 'shanghai',
  name: 'Shanghai',
  coverImageUrl: 'https://example.com/shanghai.jpg',
  guideCount: 12,
};

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

  // --- getFeaturedGuides ---

  it('getFeaturedGuides returns guides on success', async () => {
    const guides: FeaturedGuide[] = [mockGuide];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(guides),
    });

    const result = await getFeaturedGuides();
    expect(result).toEqual(guides);
    expect(fetch).toHaveBeenCalledWith('/api/home/featured-guides', { cache: 'no-store' });
  });

  it('getFeaturedGuides throws on non-OK response with message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ message: 'Database connection failed' }),
    });

    await expect(getFeaturedGuides()).rejects.toThrow('500: Database connection failed');
  });

  it('getFeaturedGuides throws with statusText when no message in body', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(getFeaturedGuides()).rejects.toThrow('503: Service Unavailable');
  });

  // --- getPopularDestinations ---

  it('getPopularDestinations returns cities on success', async () => {
    const cities: PopularCity[] = [mockCity];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(cities),
    });

    const result = await getPopularDestinations();
    expect(result).toEqual(cities);
    expect(fetch).toHaveBeenCalledWith('/api/home/popular-destinations', { cache: 'no-store' });
  });

  it('getPopularDestinations throws on non-OK', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ message: 'No destinations found' }),
    });

    await expect(getPopularDestinations()).rejects.toThrow('404: No destinations found');
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
