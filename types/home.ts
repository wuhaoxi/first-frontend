export type SectionId =
  | 'search-entry'
  | 'editors-picks'
  | 'function-navigation'
  | 'popular-destinations'
  | 'hot-posts'
  | 'ai-assistant-entry';

export type SectionState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

export interface FeaturedGuide {
  id: number;
  title: string;
  cityName: string;
  coverImageUrl: string | null;
  recommendation: string;
  slug: string;
}

export interface PopularCity {
  slug: string;
  name: string;
  coverImageUrl: string | null;
  guideCount: number;
}

export interface HotPost {
  id: number;
  title: string;
  cityName: string | null;
  commentCount: number;
  createdAt: string;
}
