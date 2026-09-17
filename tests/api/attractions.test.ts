import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAttractions,
  getPopularAttractions,
  getAttractionBySlug,
} from '@/lib/api/attractions';
import type { AttractionSummary, AttractionResponse } from '@/types/attraction';
import type { PageResponse } from '@/types/interactions';

const mockSummary: AttractionSummary = {
  id: 1,
  createdAt: '2026-09-01T12:00:00Z',
  slug: 'forbidden-city',
  name: 'Forbidden City',
  nameZh: '故宫',
  category: 'HISTORICAL_SITE',
  tags: ['unesco', 'palace'],
  city: 'Beijing',
  citySlug: 'beijing',
  summary: 'Imperial palace at the heart of Beijing.',
  coverImageUrl: null,
  bookingRequired: true,
  ratingScore: 4.9,
  favoriteCount: 5100,
  heatScore: 98,
};

const mockDetail: AttractionResponse = {
  ...mockSummary,
  province: 'Beijing',
  address: '4 Jingshan Front St',
  latitude: 39.9163,
  longitude: 116.3972,
  description: "The world's largest palace complex.",
  openingHours: '08:30-17:00',
  ticketPrice: '¥60',
  bookingNote: 'Book with passport 7 days ahead',
  suggestedDuration: '3-4 hours',
  updatedAt: '2026-09-02T12:00:00Z',
  gallery: ['https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/fc.jpg/960px-fc.jpg'],
  commentCount: 3,
  favorited: null,
};

describe('attractions API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- getAttractions ---

  it('getAttractions sends no query string when called without params', async () => {
    const page: PageResponse<AttractionSummary> = {
      content: [mockSummary],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(page),
    });

    const result = await getAttractions();
    expect(result).toEqual(page);
    expect(fetch).toHaveBeenCalledWith('/api/attractions', { cache: 'no-store' });
  });

  it('getAttractions appends only defined params', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
    });

    await getAttractions({ city: 'beijing', category: 'MUSEUM', page: 1, size: 10 });
    expect(fetch).toHaveBeenCalledWith(
      '/api/attractions?city=beijing&category=MUSEUM&page=1&size=10',
      { cache: 'no-store' }
    );

    await getAttractions({ page: 2 });
    expect(fetch).toHaveBeenCalledWith('/api/attractions?page=2', { cache: 'no-store' });
  });

  // --- getPopularAttractions ---

  it('getPopularAttractions omits limit when no argument given', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockSummary]),
    });

    const result = await getPopularAttractions();
    expect(result).toEqual([mockSummary]);
    expect(fetch).toHaveBeenCalledWith('/api/attractions/popular', { cache: 'no-store' });
  });

  it('getPopularAttractions appends limit when given', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await getPopularAttractions(3);
    expect(fetch).toHaveBeenCalledWith('/api/attractions/popular?limit=3', { cache: 'no-store' });
  });

  // --- getAttractionBySlug ---

  it('getAttractionBySlug fetches the slug path', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockDetail),
    });

    const result = await getAttractionBySlug('forbidden-city');
    expect(result).toEqual(mockDetail);
    expect(fetch).toHaveBeenCalledWith('/api/attractions/forbidden-city', { cache: 'no-store' });
  });

  it('getAttractionBySlug throws on non-OK with status and message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ message: 'Attraction not found: ghost-site' }),
    });

    await expect(getAttractionBySlug('ghost-site')).rejects.toThrow('404: Attraction not found: ghost-site');
  });

  it('throws with statusText when error body is not JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(getAttractions()).rejects.toThrow('500: Internal Server Error');
  });
});
