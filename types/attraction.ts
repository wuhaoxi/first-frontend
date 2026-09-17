export type AttractionCategory =
  | 'HISTORICAL_SITE'
  | 'TEMPLE'
  | 'MUSEUM'
  | 'NATURE'
  | 'MODERN_LANDMARK'
  | 'STREET_DISTRICT';

export interface AttractionSummary {
  id: number;
  createdAt: string;
  slug: string;
  name: string;
  nameZh: string;
  category: AttractionCategory;
  tags: string[];
  city: string;
  citySlug: string;
  summary: string;
  coverImageUrl: string | null;
  bookingRequired: boolean;
  ratingScore: number;
  favoriteCount: number;
  heatScore: number;
}

export interface AttractionResponse extends AttractionSummary {
  province: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string;
  openingHours: string | null;
  ticketPrice: string | null;
  bookingNote: string | null;
  suggestedDuration: string | null;
  updatedAt: string | null;
  gallery: string[];
  commentCount: number;
  favorited: boolean | null;
}

export interface GetAttractionsParams {
  city?: string;
  category?: AttractionCategory;
  page?: number;
  size?: number;
}
