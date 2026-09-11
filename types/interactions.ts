export type VoteType = 'UP' | 'DOWN';

export interface VoteStatsResponse {
  upCount: number;
  downCount: number;
  userVote: VoteType | null;
}

export interface BookmarkResponse {
  bookmarked: boolean;
}

export interface CommentResponse {
  id: number;
  postId: number;
  userId: number;
  content: string;
  parentCommentId: number | null;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
