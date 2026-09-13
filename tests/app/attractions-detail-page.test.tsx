import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttractionDetailPage from '@/app/attractions/[slug]/page';
import { getAttractionBySlug } from '@/lib/api/attractions';
import type { AttractionResponse } from '@/types/attraction';

vi.mock('@/lib/api/attractions');

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function attraction(overrides: Partial<AttractionResponse> = {}): AttractionResponse {
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
    province: 'Hebei',
    address: '4 Jingshan Front St',
    latitude: 39.9163,
    longitude: 116.3972,
    summary: 'Imperial palace at the heart of Beijing.',
    description: 'The world\u2019s largest palace complex, home to 24 emperors.',
    coverImageUrl: null,
    openingHours: '08:30-17:00 (closed Mondays)',
    ticketPrice: '¥60',
    bookingRequired: false,
    bookingNote: null,
    suggestedDuration: '3-4 hours',
    updatedAt: '2026-09-02T12:00:00Z',
    ...overrides,
  };
}

describe('AttractionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAttractionBySlug).mockReset();
  });

  it('shows skeleton placeholders while loading', () => {
    vi.mocked(getAttractionBySlug).mockReturnValue(new Promise<AttractionResponse>(() => {}));

    const { container } = render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renders the full attraction detail after loading', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction());

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);

    expect(await screen.findByText('Forbidden City')).toBeInTheDocument();
    expect(screen.getByText('故宫')).toBeInTheDocument();
    expect(screen.getByText('Historical Site')).toBeInTheDocument();
    expect(screen.getByText('unesco')).toBeInTheDocument();
    expect(screen.getByText('Beijing, Hebei')).toBeInTheDocument();
    expect(screen.getByText('Imperial palace at the heart of Beijing.')).toBeInTheDocument();
    expect(
      screen.getByText('The world\u2019s largest palace complex, home to 24 emperors.')
    ).toBeInTheDocument();
    expect(getAttractionBySlug).toHaveBeenCalledWith('forbidden-city');
  });

  it('renders practical-info rows when present', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction());

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.getByText('Opening hours')).toBeInTheDocument();
    expect(screen.getByText('08:30-17:00 (closed Mondays)')).toBeInTheDocument();
    expect(screen.getByText('Ticket price')).toBeInTheDocument();
    expect(screen.getByText('¥60')).toBeInTheDocument();
    expect(screen.getByText('Suggested duration')).toBeInTheDocument();
    expect(screen.getByText('3-4 hours')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('4 Jingshan Front St')).toBeInTheDocument();
  });

  it('omits practical-info rows whose fields are null', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(
      attraction({ openingHours: null, ticketPrice: null, suggestedDuration: null, address: null })
    );

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.queryByText('Opening hours')).not.toBeInTheDocument();
    expect(screen.queryByText('Ticket price')).not.toBeInTheDocument();
    expect(screen.queryByText('Suggested duration')).not.toBeInTheDocument();
    expect(screen.queryByText('Address')).not.toBeInTheDocument();
  });

  it('shows the booking alert with the booking note when booking is required', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(
      attraction({ bookingRequired: true, bookingNote: 'Book with passport 7 days ahead' })
    );

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.getByText('Advance booking required')).toBeInTheDocument();
    expect(screen.getByText('Book with passport 7 days ahead')).toBeInTheDocument();
  });

  it('shows the generic booking text when the note is null', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(
      attraction({ bookingRequired: true, bookingNote: null })
    );

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.getByText('Advance booking required')).toBeInTheDocument();
    expect(screen.getByText('Book ahead of your visit')).toBeInTheDocument();
  });

  it('renders no booking alert when booking is not required', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction({ bookingRequired: false }));

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.queryByText('Advance booking required')).not.toBeInTheDocument();
  });

  it('renders the map link when both coordinates are present', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction());

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    const mapLink = screen.getByRole('link', { name: /Open in map/i });
    expect(mapLink).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=39.9163,116.3972'
    );
    expect(mapLink).toHaveAttribute('target', '_blank');
  });

  it('renders no map link when a coordinate is missing', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction({ longitude: null }));

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.queryByRole('link', { name: /Open in map/i })).not.toBeInTheDocument();
  });

  it('shows the not-found panel with a back link and no Retry for 404 errors', async () => {
    vi.mocked(getAttractionBySlug).mockRejectedValue(
      new Error('404: Attraction not found: ghost-site')
    );

    render(<AttractionDetailPage params={{ slug: 'ghost-site' }} />);

    expect(await screen.findByText('Attraction not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to attractions/i })).toHaveAttribute(
      'href',
      '/attractions'
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('shows the error message with a working Retry for other failures', async () => {
    vi.mocked(getAttractionBySlug)
      .mockRejectedValueOnce(new Error('500: Server error'))
      .mockResolvedValueOnce(attraction());

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);

    expect(await screen.findByText('500: Server error')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to attractions/i })).toHaveAttribute(
      'href',
      '/attractions'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Forbidden City')).toBeInTheDocument();
    expect(getAttractionBySlug).toHaveBeenCalledTimes(2);
  });

  it('provides a back link on successful render', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction());

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.getByRole('link', { name: /Back to attractions/i })).toHaveAttribute(
      'href',
      '/attractions'
    );
  });
});
