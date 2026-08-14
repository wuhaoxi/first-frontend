export type PostStatus = 'DRAFT' | 'PUBLISHED';

export interface PostSummary {
  id: number;
  title: string;
  coverImage: string | null;
  tags: string[];
  authorId: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostResponse extends PostSummary {
  content: string;
  status: PostStatus;
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
