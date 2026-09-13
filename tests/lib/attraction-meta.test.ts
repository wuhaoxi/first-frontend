import { describe, it, expect } from 'vitest';
import { CATEGORY_LABELS, CITY_OPTIONS } from '@/lib/attraction-meta';
import type { AttractionCategory } from '@/types/attraction';

const ALL_CATEGORIES: AttractionCategory[] = [
  'HISTORICAL_SITE',
  'TEMPLE',
  'MUSEUM',
  'NATURE',
  'MODERN_LANDMARK',
  'STREET_DISTRICT',
];

describe('attraction display constants', () => {
  it('CATEGORY_LABELS covers all 6 categories with non-blank labels', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...ALL_CATEGORIES].sort());
    for (const category of ALL_CATEGORIES) {
      expect(CATEGORY_LABELS[category].trim()).not.toBe('');
    }
  });

  it('CITY_OPTIONS lists the 6 seeded cities with labels in fixed order', () => {
    expect(CITY_OPTIONS).toEqual([
      { slug: 'beijing', label: 'Beijing' },
      { slug: 'xian', label: "Xi'an" },
      { slug: 'shanghai', label: 'Shanghai' },
      { slug: 'chengdu', label: 'Chengdu' },
      { slug: 'hangzhou', label: 'Hangzhou' },
      { slug: 'guilin', label: 'Guilin' },
    ]);
  });
});
