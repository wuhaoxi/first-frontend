import { authFetch, ApiResponse } from '@/lib/api/client';
import {
  VoteType,
  VoteStatsResponse,
  BookmarkResponse,
  CommentResponse,
  CommentApiAdapter,
  PageResponse,
} from '@/types/interactions';

const PAGE_SIZE = 20;

export function getVoteStats(postId: number): Promise<ApiResponse<VoteStatsResponse>> {
  return authFetch<VoteStatsResponse>(`/api/posts/${postId}/vote-stats`);
}

export function castVote(postId: number, voteType: VoteType): Promise<ApiResponse<VoteStatsResponse>> {
  return authFetch<VoteStatsResponse>(`/api/posts/${postId}/votes`, {
    method: 'POST',
    body: JSON.stringify({ voteType }),
  });
}

export function toggleBookmark(postId: number): Promise<ApiResponse<BookmarkResponse>> {
  return authFetch<BookmarkResponse>(`/api/posts/${postId}/bookmark`, { method: 'POST' });
}

export function getTopLevelComments(
  postId: number,
  page = 0,
  size = PAGE_SIZE
): Promise<ApiResponse<PageResponse<CommentResponse>>> {
  return authFetch<PageResponse<CommentResponse>>(
    `/api/posts/${postId}/comments?page=${page}&size=${size}`
  );
}

export function getReplies(
  commentId: number,
  page = 0,
  size = PAGE_SIZE
): Promise<ApiResponse<PageResponse<CommentResponse>>> {
  return authFetch<PageResponse<CommentResponse>>(
    `/api/comments/${commentId}/replies?page=${page}&size=${size}`
  );
}

export function createComment(postId: number, content: string): Promise<ApiResponse<CommentResponse>> {
  return authFetch<CommentResponse>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function createReply(commentId: number, content: string): Promise<ApiResponse<CommentResponse>> {
  return authFetch<CommentResponse>(`/api/comments/${commentId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function deleteComment(commentId: number): Promise<ApiResponse<null>> {
  return authFetch<null>(`/api/comments/${commentId}`, { method: 'DELETE' });
}

/** `CommentSection` adapter backed by the post comment endpoints. */
export const postCommentApi: CommentApiAdapter = {
  getTopLevelComments,
  createComment,
  getReplies,
  createReply,
  deleteComment,
};

/** Maps the bookmark toggle response to a plain boolean state for `BookmarkButton`. */
export async function toggleBookmarkState(postId: number): Promise<ApiResponse<boolean>> {
  const result = await toggleBookmark(postId);
  if (!result.ok || result.data === null) {
    return { ok: false, data: null, message: result.message };
  }
  return { ok: true, data: result.data.bookmarked, message: null };
}
