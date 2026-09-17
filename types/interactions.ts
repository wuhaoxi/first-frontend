import type { ApiResponse } from '@/lib/api/client';

export type VoteType = 'UP' | 'DOWN';

export interface VoteStatsResponse {
  upCount: number;
  downCount: number;
  userVote: VoteType | null;
}

export interface BookmarkResponse {
  bookmarked: boolean;
}

/** Rendered fields only — target-agnostic (posts and attractions). */
export interface CommentView {
  id: number;
  userId: number;
  content: string;
  parentCommentId: number | null;
  replyCount: number;
  createdAt: string;
}

export interface CommentResponse extends CommentView {
  postId: number;
  updatedAt: string;
}

export interface AttractionCommentResponse extends CommentView {
  attractionId: number;
  updatedAt: string;
}

/** Injectable comment API surface consumed by `CommentSection`. */
export interface CommentApiAdapter {
  getTopLevelComments(
    targetId: number,
    page: number,
    size: number
  ): Promise<ApiResponse<PageResponse<CommentView>>>;
  createComment(targetId: number, content: string): Promise<ApiResponse<CommentView>>;
  getReplies(
    parentId: number,
    page: number,
    size: number
  ): Promise<ApiResponse<PageResponse<CommentView>>>;
  createReply(parentId: number, content: string): Promise<ApiResponse<CommentView>>;
  deleteComment(commentId: number): Promise<ApiResponse<null>>;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
