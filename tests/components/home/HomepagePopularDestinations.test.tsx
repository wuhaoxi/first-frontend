import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomepagePopularDestinations } from '@/components/home/HomepagePopularDestinations';
import type { PopularCity } from '@/types/home';

const mockCities: PopularCity[] = [
  { slug: 'chengdu', name: 'Chengdu', coverImageUrl: '/chengdu.jpg', guideCount: 10 },
  { slug: 'beijing', name: 'Beijing', coverImageUrl: '/beijing.jpg', guideCount: 8 },
  { slug: 'shanghai', name: 'Shanghai', coverImageUrl: null, guideCount: 5 },
  { slug: 'xian', name: 'Xian', coverImageUrl: '/xian.jpg', guideCount: 0 },
];

describe('HomepagePopularDestinations', () => {
  it('renders all city names', () => {
    render(<HomepagePopularDestinations cities={mockCities} />);
    expect(screen.getByText('Chengdu')).toBeInTheDocument();
    expect(screen.getByText('Beijing')).toBeInTheDocument();
    expect(screen.getByText('Shanghai')).toBeInTheDocument();
    expect(screen.getByText('Xian')).toBeInTheDocument();
  });

  it('shows "N guides" label for cities with guides', () => {
    render(<HomepagePopularDestinations cities={mockCities} />);
    expect(screen.getByText('10 guides')).toBeInTheDocument();
    expect(screen.getByText('8 guides')).toBeInTheDocument();
    expect(screen.getByText('5 guides')).toBeInTheDocument();
  });

  it('shows "Coming soon" for zero-guide city', () => {
    render(<HomepagePopularDestinations cities={mockCities} />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('card with guides is a link to /guides?city={slug}', () => {
    render(<HomepagePopularDestinations cities={mockCities} />);
    const link = screen.getByRole('link', { name: /Chengdu/i });
    expect(link).toHaveAttribute('href', '/guides?city=chengdu');
  });

  it('zero-guide card is a plain div (not a link, not focusable)', () => {
    render(<HomepagePopularDestinations cities={mockCities} />);
    const xianCard = screen.getByText('Xian').closest('a');
    expect(xianCard).toBeNull(); // Should not be inside a link
  });

  it('shows placeholder element when coverImageUrl is null', () => {
    render(<HomepagePopularDestinations cities={mockCities} />);
    // Shanghai has coverImageUrl: null, should render a letter placeholder div
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('calls onCityClick with slug on card click', async () => {
    const onCityClick = vi.fn();
    render(<HomepagePopularDestinations cities={mockCities} onCityClick={onCityClick} />);
    const link = screen.getByRole('link', { name: /Chengdu/i });
    await userEvent.click(link);
    expect(onCityClick).toHaveBeenCalledWith('chengdu');
  });

  it('truncates to max 6 cities', () => {
    const manyCities = Array.from({ length: 8 }, (_, i) => ({
      slug: `city-${i}`,
      name: `City ${i}`,
      coverImageUrl: null,
      guideCount: 1,
    }));
    const { container } = render(<HomepagePopularDestinations cities={manyCities} />);
    const cards = container.querySelectorAll('a');
    expect(cards.length).toBeLessThanOrEqual(6);
  });
});
