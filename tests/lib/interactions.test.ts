import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getVoteStats,
  castVote,
  toggleBookmark,
  getTopLevelComments,
  getReplies,
  createComment,
  createReply,
  deleteComment,
} from '@/lib/api/interactions';
import { authFetch, ApiResponse } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  authFetch: vi.fn(),
}));

const authFetchMock = vi.mocked(authFetch);

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, message: null };
}

describe('interactions API', () => {
  beforeEach(() => {
    authFetchMock.mockReset();
  });

  it('getVoteStats calls GET on the vote-stats endpoint', async () => {
    authFetchMock.mockResolvedValue(ok({ upCount: 1, downCount: 0, userVote: 'UP' }));

    const result = await getVoteStats(1);

    expect(authFetchMock).toHaveBeenCalledWith('/api/posts/1/vote-stats');
    expect(result.ok).toBe(true);
  });

  it('castVote posts the vote type as JSON body', async () => {
    authFetchMock.mockResolvedValue(ok({ upCount: 2, downCount: 0, userVote: 'UP' }));

    await castVote(1, 'UP');

    expect(authFetchMock).toHaveBeenCalledWith('/api/posts/1/votes', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'UP' }),
    });
  });

  it('castVote supports DOWN votes', async () => {
    authFetchMock.mockResolvedValue(ok({ upCount: 0, downCount: 1, userVote: 'DOWN' }));

    await castVote(1, 'DOWN');

    expect(authFetchMock).toHaveBeenCalledWith('/api/posts/1/votes', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'DOWN' }),
    });
  });

  it('toggleBookmark POSTs to the bookmark endpoint', async () => {
    authFetchMock.mockResolvedValue(ok({ bookmarked: true }));

    await toggleBookmark(1);

    expect(authFetchMock).toHaveBeenCalledWith('/api/posts/1/bookmark', { method: 'POST' });
  });

  it('getTopLevelComments passes page and size query params', async () => {
    authFetchMock.mockResolvedValue(ok({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }));

    await getTopLevelComments(1, 1, 10);

    expect(authFetchMock).toHaveBeenCalledWith('/api/posts/1/comments?page=1&size=10');
  });

  it('getTopLevelComments defaults to page 0 size 20', async () => {
    authFetchMock.mockResolvedValue(ok({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }));

    await getTopLevelComments(1);

    expect(authFetchMock).toHaveBeenCalledWith('/api/posts/1/comments?page=0&size=20');
  });

  it('getReplies calls the replies endpoint with query params', async () => {
    authFetchMock.mockResolvedValue(ok({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }));

    await getReplies(5, 0, 20);

    expect(authFetchMock).toHaveBeenCalledWith('/api/comments/5/replies?page=0&size=20');
  });

  it('createComment POSTs content to the post comments endpoint', async () => {
    authFetchMock.mockResolvedValue(ok({ id: 10, postId: 1, userId: 1, content: 'hello', parentCommentId: null, replyCount: 0, createdAt: '', updatedAt: '' }));

    await createComment(1, 'hello');

    expect(authFetchMock).toHaveBeenCalledWith('/api/posts/1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'hello' }),
    });
  });

  it('createReply POSTs content to the reply endpoint', async () => {
    authFetchMock.mockResolvedValue(ok({ id: 11, postId: 1, userId: 1, content: 'hi', parentCommentId: 5, replyCount: 0, createdAt: '', updatedAt: '' }));

    await createReply(5, 'hi');

    expect(authFetchMock).toHaveBeenCalledWith('/api/comments/5/replies', {
      method: 'POST',
      body: JSON.stringify({ content: 'hi' }),
    });
  });

  it('deleteComment DELETEs the comment endpoint', async () => {
    authFetchMock.mockResolvedValue(ok(null));

    await deleteComment(9);

    expect(authFetchMock).toHaveBeenCalledWith('/api/comments/9', { method: 'DELETE' });
  });
});
