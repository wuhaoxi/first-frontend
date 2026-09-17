import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttractionDetailPage from '@/app/attractions/[slug]/page';
import { getAttractionBySlug } from '@/lib/api/attractions';
import { attractionCommentApi, toggleFavoriteState } from '@/lib/api/attraction-interactions';
import type { AttractionResponse } from '@/types/attraction';

vi.mock('@/lib/api/attractions');

vi.mock('@/lib/api/attraction-interactions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/attraction-interactions')>();
  return { ...actual, toggleFavoriteState: vi.fn() };
});

type AuthState = {
  user: { id: number; name: string; email: string } | null;
  isLoading: boolean;
};

const { mockPush, mockAuth } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockAuth: vi.fn<() => AuthState>(() => ({
    user: { id: 1, name: 'Alice', email: 'a@x.com' },
    isLoading: false,
  })),
}));

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const { lastCommentSectionProps } = vi.hoisted(() => ({
  lastCommentSectionProps: {
    current: null as {
      targetId: number;
      commentCount: number;
      api: unknown;
      onCommentMutated: () => void;
    } | null,
  },
}));

vi.mock('@/components/post/CommentSection', () => ({
  default: (props: {
    targetId: number;
    commentCount: number;
    api: unknown;
    onCommentMutated: () => void;
  }) => {
    lastCommentSectionProps.current = props;
    return <div data-testid="comment-section">Comment section</div>;
  },
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
    ratingScore: 4.9,
    favoriteCount: 5100,
    heatScore: 98,
    gallery: [],
    commentCount: 0,
    favorited: null,
    ...overrides,
  };
}

describe('AttractionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAttractionBySlug).mockReset();
    vi.mocked(toggleFavoriteState).mockReset();
    lastCommentSectionProps.current = null;
    mockAuth.mockImplementation(() => ({
      user: { id: 1, name: 'Alice', email: 'a@x.com' },
      isLoading: false,
    }));
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

  it('renders the gallery hero with the seeded images', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(
      attraction({ gallery: ['/g1.jpg', '/g2.jpg'], coverImageUrl: '/cover.jpg' })
    );

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.getByTestId('attraction-gallery')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next image' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous image' })).toBeInTheDocument();
  });

  it('renders the letter placeholder in the gallery when no images exist', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(
      attraction({ gallery: [], coverImageUrl: null })
    );

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the stats row with formatted rating and favorite counts', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction());

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.getByText('★ 4.9')).toBeInTheDocument();
    expect(screen.getByText('♥ 5.1k')).toBeInTheDocument();
  });

  it('renders the favorite button with favorite labels beside the stats', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction());

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeInTheDocument();
  });

  it('lays out a two-column grid with a sticky sidebar on large screens', async () => {
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction({ bookingRequired: true }));

    const { container } = render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    const grid = container.querySelector('[class*="lg:grid-cols-3"]');
    expect(grid).not.toBeNull();

    const main = container.querySelector('[class*="lg:col-span-2"]');
    expect(main).not.toBeNull();
    expect(main).toContainElement(
      screen.getByText('The world\u2019s largest palace complex, home to 24 emperors.')
    );

    const aside = container.querySelector('[class*="lg:sticky"]');
    expect(aside).not.toBeNull();
    expect(aside).toContainElement(screen.getByText('Practical information'));
    expect(aside).toContainElement(screen.getByText('Advance booking required'));
    expect(aside).toContainElement(screen.getByRole('link', { name: /Open in map/i }));
  });

  it('refetches the detail after a successful favorite toggle', async () => {
    vi.mocked(getAttractionBySlug)
      .mockResolvedValueOnce(attraction({ favorited: false, favoriteCount: 5100 }))
      .mockResolvedValueOnce(attraction({ favorited: true, favoriteCount: 5101 }));
    vi.mocked(toggleFavoriteState).mockResolvedValue({ ok: true, data: true, message: null });

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    await userEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

    await waitFor(() => {
      expect(toggleFavoriteState).toHaveBeenCalledWith(1);
    });
    await waitFor(() => {
      expect(getAttractionBySlug).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument();
  });

  it('redirects guests to /login without refetching when favoriting', async () => {
    mockAuth.mockImplementation(() => ({ user: null, isLoading: false }));
    vi.mocked(getAttractionBySlug).mockResolvedValue(attraction());

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    await userEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(toggleFavoriteState).not.toHaveBeenCalled();
    expect(getAttractionBySlug).toHaveBeenCalledTimes(1);
  });

  it('passes the attraction comment wiring to CommentSection and refetches on mutation', async () => {
    vi.mocked(getAttractionBySlug)
      .mockResolvedValueOnce(attraction({ commentCount: 3 }))
      .mockResolvedValueOnce(attraction({ commentCount: 4 }));

    render(<AttractionDetailPage params={{ slug: 'forbidden-city' }} />);
    await screen.findByText('Forbidden City');

    expect(lastCommentSectionProps.current?.targetId).toBe(1);
    expect(lastCommentSectionProps.current?.commentCount).toBe(3);
    expect(lastCommentSectionProps.current?.api).toBe(attractionCommentApi);
    expect(typeof lastCommentSectionProps.current?.onCommentMutated).toBe('function');

    await act(async () => {
      lastCommentSectionProps.current?.onCommentMutated();
    });

    await waitFor(() => {
      expect(getAttractionBySlug).toHaveBeenCalledTimes(2);
    });
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
