export type PostStatus = 'DRAFT' | 'PUBLISHED';

export interface PostBase {
  id: number;
  title: string;
  coverImage: string | null;
  tags: string[];
  authorId: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostSummary extends PostBase {
  upVoteCount: number;
  bookmarkCount: number;
}

export interface PostResponse extends PostBase {
  content: string;
  status: PostStatus;
  bookmarked: boolean | null;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  tags?: string[];
  coverImage?: string;
  status?: PostStatus;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  tags?: string[];
  coverImage?: string;
  status?: PostStatus;
}

export type PostSort = 'latest' | 'upvotes' | 'comments';

export interface GetPostsParams {
  sort?: PostSort;
  page?: number;
  size?: number;
  cursor?: string;
}

export interface PostListResponse {
  content: PostSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  nextCursor: string | null;
  hasMore: boolean;
}
