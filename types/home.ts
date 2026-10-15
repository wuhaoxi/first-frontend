export type SectionId =
  | 'search-entry'
  | 'featured-destinations'
  | 'function-navigation'
  | 'popular-destinations'
  | 'hot-posts'
  | 'ai-assistant-entry';

export type SectionState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

export interface HotPost {
  id: number;
  title: string;
  cityName: string | null;
  commentCount: number;
  createdAt: string;
}
