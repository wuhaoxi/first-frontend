import { authFetch, ApiResponse } from '@/lib/api/client';
import {
  AttractionCommentResponse,
  CommentApiAdapter,
  CommentView,
  PageResponse,
} from '@/types/interactions';

const PAGE_SIZE = 20;

/** `CommentSection` adapter backed by the attraction comment endpoints. */
export const attractionCommentApi: CommentApiAdapter = {
  getTopLevelComments(
    targetId: number,
    page = 0,
    size = PAGE_SIZE
  ): Promise<ApiResponse<PageResponse<CommentView>>> {
    return authFetch<PageResponse<CommentView>>(
      `/api/attractions/${targetId}/comments?page=${page}&size=${size}`
    );
  },
  createComment(targetId: number, content: string): Promise<ApiResponse<CommentView>> {
    return authFetch<AttractionCommentResponse>(`/api/attractions/${targetId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
  getReplies(
    parentId: number,
    page = 0,
    size = PAGE_SIZE
  ): Promise<ApiResponse<PageResponse<CommentView>>> {
    return authFetch<PageResponse<CommentView>>(
      `/api/attraction-comments/${parentId}/replies?page=${page}&size=${size}`
    );
  },
  createReply(parentId: number, content: string): Promise<ApiResponse<CommentView>> {
    return authFetch<AttractionCommentResponse>(`/api/attraction-comments/${parentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
  deleteComment(commentId: number): Promise<ApiResponse<null>> {
    return authFetch<null>(`/api/attraction-comments/${commentId}`, { method: 'DELETE' });
  },
};

/** POSTs the favorite toggle; the response carries the new state. */
export function toggleFavorite(attractionId: number): Promise<ApiResponse<{ favorited: boolean }>> {
  return authFetch<{ favorited: boolean }>(`/api/attractions/${attractionId}/favorite`, {
    method: 'POST',
  });
}

/** Maps the favorite toggle response to a plain boolean state for `BookmarkButton`. */
export async function toggleFavoriteState(attractionId: number): Promise<ApiResponse<boolean>> {
  const result = await toggleFavorite(attractionId);
  if (!result.ok || result.data === null) {
    return { ok: false, data: null, message: result.message };
  }
  return { ok: true, data: result.data.favorited, message: null };
}
