import type { AttractionCategory } from '@/types/attraction';

export const CATEGORY_LABELS: Record<AttractionCategory, string> = {
  HISTORICAL_SITE: 'Historical Site',
  TEMPLE: 'Temple',
  MUSEUM: 'Museum',
  NATURE: 'Nature',
  MODERN_LANDMARK: 'Modern Landmark',
  STREET_DISTRICT: 'Street District',
};

export const CITY_OPTIONS: { slug: string; label: string }[] = [
  { slug: 'beijing', label: 'Beijing' },
  { slug: 'xian', label: "Xi'an" },
  { slug: 'shanghai', label: 'Shanghai' },
  { slug: 'chengdu', label: 'Chengdu' },
  { slug: 'hangzhou', label: 'Hangzhou' },
  { slug: 'guilin', label: 'Guilin' },
];
