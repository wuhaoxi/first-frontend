import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  attractionCommentApi,
  toggleFavorite,
  toggleFavoriteState,
} from '@/lib/api/attraction-interactions';
import { authFetch, ApiResponse } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  authFetch: vi.fn(),
}));

const authFetchMock = vi.mocked(authFetch);

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, message: null };
}

describe('attraction interactions API', () => {
  beforeEach(() => {
    authFetchMock.mockReset();
  });

  it('attractionCommentApi.getTopLevelComments calls the attraction comments endpoint', async () => {
    authFetchMock.mockResolvedValue(ok({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }));

    await attractionCommentApi.getTopLevelComments(7, 0, 20);

    expect(authFetchMock).toHaveBeenCalledWith('/api/attractions/7/comments?page=0&size=20');
  });

  it('attractionCommentApi.getTopLevelComments passes custom pagination', async () => {
    authFetchMock.mockResolvedValue(ok({ content: [], page: 2, size: 5, totalElements: 0, totalPages: 0 }));

    await attractionCommentApi.getTopLevelComments(7, 2, 5);

    expect(authFetchMock).toHaveBeenCalledWith('/api/attractions/7/comments?page=2&size=5');
  });

  it('attractionCommentApi.createComment POSTs content to the attraction comments endpoint', async () => {
    authFetchMock.mockResolvedValue(
      ok({ id: 10, attractionId: 7, userId: 1, content: 'nice', parentCommentId: null, replyCount: 0, createdAt: '', updatedAt: '' })
    );

    const result = await attractionCommentApi.createComment(7, 'nice');

    expect(authFetchMock).toHaveBeenCalledWith('/api/attractions/7/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'nice' }),
    });
    expect(result.ok).toBe(true);
  });

  it('attractionCommentApi.getReplies calls the replies endpoint with query params', async () => {
    authFetchMock.mockResolvedValue(ok({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }));

    await attractionCommentApi.getReplies(5, 0, 20);

    expect(authFetchMock).toHaveBeenCalledWith('/api/attraction-comments/5/replies?page=0&size=20');
  });

  it('attractionCommentApi.createReply POSTs content to the reply endpoint', async () => {
    authFetchMock.mockResolvedValue(
      ok({ id: 11, attractionId: 7, userId: 1, content: 'hi', parentCommentId: 5, replyCount: 0, createdAt: '', updatedAt: '' })
    );

    await attractionCommentApi.createReply(5, 'hi');

    expect(authFetchMock).toHaveBeenCalledWith('/api/attraction-comments/5/replies', {
      method: 'POST',
      body: JSON.stringify({ content: 'hi' }),
    });
  });

  it('attractionCommentApi.deleteComment DELETEs the attraction comment endpoint', async () => {
    authFetchMock.mockResolvedValue(ok(null));

    await attractionCommentApi.deleteComment(9);

    expect(authFetchMock).toHaveBeenCalledWith('/api/attraction-comments/9', { method: 'DELETE' });
  });

  it('toggleFavorite POSTs to the favorite endpoint', async () => {
    authFetchMock.mockResolvedValue(ok({ favorited: true }));

    await toggleFavorite(7);

    expect(authFetchMock).toHaveBeenCalledWith('/api/attractions/7/favorite', { method: 'POST' });
  });

  it('toggleFavoriteState maps favorited:true to data:true', async () => {
    authFetchMock.mockResolvedValue(ok({ favorited: true }));

    const result = await toggleFavoriteState(7);

    expect(authFetchMock).toHaveBeenCalledWith('/api/attractions/7/favorite', { method: 'POST' });
    expect(result).toEqual({ ok: true, data: true, message: null });
  });

  it('toggleFavoriteState maps favorited:false to data:false', async () => {
    authFetchMock.mockResolvedValue(ok({ favorited: false }));

    const result = await toggleFavoriteState(7);

    expect(result).toEqual({ ok: true, data: false, message: null });
  });

  it('toggleFavoriteState propagates failures', async () => {
    authFetchMock.mockResolvedValue({ ok: false, data: null, message: 'Unauthorized' });

    const result = await toggleFavoriteState(7);

    expect(result).toEqual({ ok: false, data: null, message: 'Unauthorized' });
  });
});
