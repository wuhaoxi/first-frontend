import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { HomepageFeaturedDestinations } from '@/components/home/HomepageFeaturedDestinations';
import type { AttractionSummary } from '@/types/attraction';

function makeAttraction(overrides: Partial<AttractionSummary> = {}): AttractionSummary {
  return {
    id: 1,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'forbidden-city',
    name: 'Forbidden City',
    nameZh: '故宫',
    category: 'HISTORICAL_SITE',
    tags: ['unesco'],
    city: 'Beijing',
    citySlug: 'beijing',
    summary: 'Imperial palace complex at the heart of Beijing.',
    coverImageUrl: '/img/forbidden-city.jpg',
    bookingRequired: false,
    ratingScore: 4.9,
    favoriteCount: 120,
    heatScore: 95,
    ...overrides,
  };
}

const slides: AttractionSummary[] = [
  makeAttraction(),
  makeAttraction({
    id: 2,
    slug: 'west-lake',
    name: 'West Lake',
    nameZh: '西湖',
    city: 'Hangzhou',
    ratingScore: 4.8,
    summary: 'Famous freshwater lake in Hangzhou.',
  }),
  makeAttraction({
    id: 3,
    slug: 'terracotta-army',
    name: 'Terracotta Army',
    nameZh: '兵马俑',
    city: "Xi'an",
    ratingScore: 4.75,
    summary: 'Clay warriors guarding an emperor mausoleum.',
    coverImageUrl: null,
  }),
];

function mockMatchMedia(reducedMotion = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('HomepageFeaturedDestinations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders name, Chinese name, city, one-decimal rating and summary for the active slide', () => {
    render(<HomepageFeaturedDestinations attractions={slides} />);

    expect(screen.getByText('Forbidden City')).toBeInTheDocument();
    expect(screen.getByText('故宫')).toBeInTheDocument();
    expect(screen.getByText('Beijing')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('Imperial palace complex at the heart of Beijing.')).toBeInTheDocument();
  });

  it('pads the rating badge to one decimal', () => {
    render(<HomepageFeaturedDestinations attractions={[makeAttraction({ ratingScore: 4 })]} />);

    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('falls back to a gradient placeholder when the cover image is missing', () => {
    render(<HomepageFeaturedDestinations attractions={[slides[2]]} />);

    expect(screen.getByText('Terracotta Army')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('links the active slide to /attractions/{slug}', () => {
    render(<HomepageFeaturedDestinations attractions={slides} />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/attractions/forbidden-city');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByRole('link')).toHaveAttribute('href', '/attractions/west-lake');
  });

  it('shows at most five slides even when more are provided', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      makeAttraction({ id: i + 1, slug: `spot-${i + 1}`, name: `Spot ${i + 1}` }),
    );

    render(<HomepageFeaturedDestinations attractions={many} />);

    expect(screen.getAllByRole('tab')).toHaveLength(5);
  });

  it('advances automatically every five seconds and wraps around', () => {
    render(<HomepageFeaturedDestinations attractions={slides} />);

    expect(screen.getByText('Forbidden City')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('West Lake')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByText('Forbidden City')).toBeInTheDocument();
  });

  it('pauses autoplay while hovered and resumes on leave', () => {
    render(<HomepageFeaturedDestinations attractions={slides} />);

    const carousel = screen.getByRole('region');
    fireEvent.mouseEnter(carousel);

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByText('Forbidden City')).toBeInTheDocument();

    fireEvent.mouseLeave(carousel);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('West Lake')).toBeInTheDocument();
  });

  it('does not autoplay when the user prefers reduced motion, but manual switching still works', () => {
    mockMatchMedia(true);
    render(<HomepageFeaturedDestinations attractions={slides} />);

    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByText('Forbidden City')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByText('West Lake')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByText('West Lake')).toBeInTheDocument();
  });

  it('arrows switch to the next and previous slides, wrapping around', () => {
    render(<HomepageFeaturedDestinations attractions={slides} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByText('West Lake')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(screen.getByText('Forbidden City')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(screen.getByText('Terracotta Army')).toBeInTheDocument();
  });

  it('dots jump to a slide and mark exactly one as selected', () => {
    render(<HomepageFeaturedDestinations attractions={slides} />);

    const dots = screen.getAllByRole('tab');
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(dots[2]);

    expect(screen.getByText('Terracotta Army')).toBeInTheDocument();
    expect(dots[2]).toHaveAttribute('aria-selected', 'true');
    expect(dots[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('manual switching resets the five-second timer', () => {
    render(<HomepageFeaturedDestinations attractions={slides} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByText('West Lake')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('Terracotta Army')).toBeInTheDocument();
  });

  it('renders nothing when the list is empty', () => {
    const { container } = render(<HomepageFeaturedDestinations attractions={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render carousel controls for a single slide', () => {
    render(<HomepageFeaturedDestinations attractions={[slides[0]]} />);

    expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous slide' })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByText('Forbidden City')).toBeInTheDocument();
  });
});
