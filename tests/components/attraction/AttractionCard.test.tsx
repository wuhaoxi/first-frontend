import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttractionCard } from '@/components/attraction/AttractionCard';
import type { AttractionSummary } from '@/types/attraction';

function makeAttraction(overrides: Partial<AttractionSummary> = {}): AttractionSummary {
  return {
    id: 1,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'forbidden-city',
    name: 'Forbidden City',
    nameZh: '故宫',
    category: 'HISTORICAL_SITE',
    tags: ['unesco', 'palace'],
    city: 'Beijing',
    citySlug: 'beijing',
    summary: 'Imperial palace at the heart of Beijing.',
    coverImageUrl: null,
    bookingRequired: false,
    ratingScore: 4.9,
    favoriteCount: 5100,
    heatScore: 98,
    ...overrides,
  };
}

describe('AttractionCard', () => {
  it('renders name, nameZh, mapped category label, city and summary', () => {
    render(<AttractionCard attraction={makeAttraction()} />);

    expect(screen.getByText('Forbidden City')).toBeInTheDocument();
    expect(screen.getByText('故宫')).toBeInTheDocument();
    expect(screen.getByText('Historical Site')).toBeInTheDocument();
    expect(screen.getByText('Beijing')).toBeInTheDocument();
    expect(screen.getByText('Imperial palace at the heart of Beijing.')).toBeInTheDocument();
  });

  it('wraps the whole card in a link to /attractions/{slug}', () => {
    render(<AttractionCard attraction={makeAttraction()} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/attractions/forbidden-city');
    // Name lives inside the link, i.e. the whole card is clickable
    expect(link).toContainElement(screen.getByText('Forbidden City'));
  });

  it('shows the first letter of name as placeholder when coverImageUrl is null', () => {
    render(<AttractionCard attraction={makeAttraction({ coverImageUrl: null })} />);

    expect(screen.getByText('F')).toBeInTheDocument();
  });

  it('renders an image (not a placeholder) when coverImageUrl is set', () => {
    render(<AttractionCard attraction={makeAttraction({ coverImageUrl: '/fc.jpg' })} />);

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Forbidden City');
    expect(screen.queryByText('F')).toBeNull();
  });

  it('shows "Booking required" badge when bookingRequired is true', () => {
    render(<AttractionCard attraction={makeAttraction({ bookingRequired: true })} />);

    expect(screen.getByText('Booking required')).toBeInTheDocument();
  });

  it('renders no booking badge when bookingRequired is false', () => {
    render(<AttractionCard attraction={makeAttraction({ bookingRequired: false })} />);

    expect(screen.queryByText('Booking required')).toBeNull();
  });
});
