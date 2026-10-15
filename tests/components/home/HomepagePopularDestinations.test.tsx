import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomepagePopularDestinations } from '@/components/home/HomepagePopularDestinations';
import type { AttractionSummary } from '@/types/attraction';

function makeAttraction(overrides: Partial<AttractionSummary> = {}): AttractionSummary {
  return {
    id: 1,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'forbidden-city',
    name: 'Forbidden City',
    nameZh: '故宫',
    category: 'HISTORICAL_SITE',
    tags: [],
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

const mockAttractions: AttractionSummary[] = [
  makeAttraction({ id: 1, slug: 'forbidden-city', name: 'Forbidden City', nameZh: '故宫', city: 'Beijing' }),
  makeAttraction({ id: 2, slug: 'terracotta-army', name: 'Terracotta Army', nameZh: '兵马俑', city: "Xi'an" }),
  makeAttraction({ id: 3, slug: 'west-lake', name: 'West Lake', nameZh: '西湖', city: 'Hangzhou' }),
  makeAttraction({ id: 4, slug: 'the-bund', name: 'The Bund', nameZh: '外滩', city: 'Shanghai' }),
];

describe('HomepagePopularDestinations', () => {
  it('renders attraction names, Chinese names and city labels', () => {
    render(<HomepagePopularDestinations attractions={mockAttractions} />);

    expect(screen.getByText('Forbidden City')).toBeInTheDocument();
    expect(screen.getByText('故宫')).toBeInTheDocument();
    expect(screen.getByText('Terracotta Army')).toBeInTheDocument();
    expect(screen.getByText('兵马俑')).toBeInTheDocument();
    expect(screen.getByText('West Lake')).toBeInTheDocument();
    expect(screen.getByText('The Bund')).toBeInTheDocument();
    expect(screen.getByText('Beijing')).toBeInTheDocument();
    expect(screen.getByText("Xi'an")).toBeInTheDocument();
    expect(screen.getByText('Hangzhou')).toBeInTheDocument();
    expect(screen.getByText('Shanghai')).toBeInTheDocument();
  });

  it('makes every card a link to /attractions/{slug}', () => {
    render(<HomepagePopularDestinations attractions={mockAttractions} />);

    expect(screen.getByRole('link', { name: /Forbidden City/i })).toHaveAttribute(
      'href',
      '/attractions/forbidden-city'
    );
    expect(screen.getByRole('link', { name: /West Lake/i })).toHaveAttribute(
      'href',
      '/attractions/west-lake'
    );
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('shows a letter placeholder when coverImageUrl is null', () => {
    const { container } = render(<HomepagePopularDestinations attractions={mockAttractions} />);

    // All four fixtures have null covers — each card shows its first letter
    const placeholders = Array.from(container.querySelectorAll('.text-2xl')).map(
      (el) => el.textContent
    );
    expect(placeholders).toEqual(['F', 'T', 'W', 'T']);
  });

  it('renders an image when coverImageUrl is set', () => {
    render(
      <HomepagePopularDestinations
        attractions={[makeAttraction({ coverImageUrl: '/fc.jpg' })]}
      />
    );

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Forbidden City');
  });

  it('overlays a one-decimal rating badge with a star on every card image', () => {
    const { container } = render(<HomepagePopularDestinations attractions={mockAttractions} />);

    const badges = Array.from(container.querySelectorAll('[class*="bg-black/50"]'));
    expect(badges).toHaveLength(4);

    badges.forEach((badge) => {
      expect(badge.textContent).toContain('4.9');
      expect(badge.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      // The badge overlays the fixed-ratio image area
      expect(badge.closest('[class*="aspect-[4/3]"]')).not.toBeNull();
    });
  });

  it('pads ratings to one decimal place', () => {
    render(<HomepagePopularDestinations attractions={[makeAttraction({ ratingScore: 4 })]} />);

    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('uses a consistent card surface with a hover lift', () => {
    render(<HomepagePopularDestinations attractions={mockAttractions} />);

    screen.getAllByRole('link').forEach((card) => {
      expect(card.className).toContain('rounded-xl');
      expect(card.className).toContain('border');
      expect(card.className).toContain('bg-card');
      expect(card.className).toContain('shadow-sm');
      expect(card.className).toContain('hover:-translate-y-0.5');
      expect(card.className).toContain('hover:shadow-md');
    });
  });

  it('calls onAttractionClick with the slug on card click', async () => {
    const onAttractionClick = vi.fn();
    render(
      <HomepagePopularDestinations attractions={mockAttractions} onAttractionClick={onAttractionClick} />
    );

    await userEvent.click(screen.getByRole('link', { name: /West Lake/i }));

    expect(onAttractionClick).toHaveBeenCalledWith('west-lake');
  });

  it('defensively truncates to 6 attractions', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      makeAttraction({ id: i + 1, slug: `spot-${i}`, name: `Spot ${i}` })
    );

    render(<HomepagePopularDestinations attractions={many} />);

    expect(screen.getAllByRole('link')).toHaveLength(6);
    expect(screen.queryByText('Spot 6')).not.toBeInTheDocument();
  });

  it('shows an empty-state message and no grid when the array is empty', () => {
    const { container } = render(<HomepagePopularDestinations attractions={[]} />);

    expect(screen.getByText('No attractions available right now')).toBeInTheDocument();
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });
});
