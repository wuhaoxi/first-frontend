import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Suspense, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { SectionContainer } from '@/components/home/SectionContainer';
import type { AttractionSummary } from '@/types/attraction';
import type { PageResponse } from '@/types/interactions';

// Mock next/navigation for SSR rendering of client components
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the homepage data clients so page rendering stays deterministic in tests
vi.mock('@/lib/api/attractions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/attractions')>();
  return { ...actual, getAttractions: vi.fn(), getPopularAttractions: vi.fn() };
});

vi.mock('@/lib/api/home', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/home')>();
  return { ...actual, getHotPosts: vi.fn() };
});

import { getAttractions, getPopularAttractions } from '@/lib/api/attractions';
import { getHotPosts } from '@/lib/api/home';
import HomePage from '@/app/page';

// --- Section order + composition isolation ---

describe('homepage section composition', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders sections in correct order (search-entry → featured-destinations → function-navigation → popular-destinations → hot-posts)', () => {
    render(
      <div>
        <section id="search-entry" data-testid="section">
          <span>search</span>
        </section>
        <SectionContainer id="featured-destinations" title="Featured Destinations" state={{ status: 'success', data: [] }}>
          <div data-testid="content">featured-destinations-content</div>
        </SectionContainer>
        <section id="function-navigation" data-testid="section">
          <span>nav</span>
        </section>
        <SectionContainer id="popular-destinations" title="Popular Destinations" state={{ status: 'success', data: [] }}>
          <div data-testid="content">destinations-content</div>
        </SectionContainer>
        <SectionContainer id="hot-posts" title="Traveler Discussions" state={{ status: 'success', data: [] }}>
          <div data-testid="content">hot-posts-content</div>
        </SectionContainer>
      </div>,
    );

    const sections = document.querySelectorAll('section');
    const ids = Array.from(sections).map((s) => s.id);

    expect(ids).toEqual([
      'search-entry',
      'featured-destinations',
      'function-navigation',
      'popular-destinations',
      'hot-posts',
    ]);
  });

  it('single-section failure does not affect other sections', () => {
    render(
      <div>
        <SectionContainer id="featured-destinations" title="Featured Destinations" state={{ status: 'success', data: [] }}>
          <div data-testid="success-section">guides loaded</div>
        </SectionContainer>
        <SectionContainer
          id="popular-destinations"
          title="Popular Destinations"
          state={{ status: 'error', message: 'Failed to load destinations' }}
        >
          <div />
        </SectionContainer>
        <SectionContainer id="hot-posts" title="Traveler Discussions" state={{ status: 'success', data: [] }}>
          <div data-testid="success-section">posts loaded</div>
        </SectionContainer>
      </div>,
    );

    // Both success sections render their children
    const successSections = screen.getAllByTestId('success-section');
    expect(successSections).toHaveLength(2);
    expect(successSections[0]).toHaveTextContent('guides loaded');
    expect(successSections[1]).toHaveTextContent('posts loaded');

    // Error section shows error message
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load destinations')).toBeInTheDocument();

    // Error section has its own section container
    const errorSection = document.getElementById('popular-destinations');
    expect(errorSection).toBeInTheDocument();
  });

  it('all data sections failing still renders the page shell (no white screen)', () => {
    render(
      <div className="homepage">
        {/* Static sections always visible */}
        <section id="search-entry">
          <span>Search</span>
        </section>

        {/* All data sections in error state */}
        <SectionContainer
          id="featured-destinations"
          title="Featured Destinations"
          state={{ status: 'error', message: 'Error 1' }}
        >
          <div />
        </SectionContainer>
        <SectionContainer
          id="popular-destinations"
          title="Popular Destinations"
          state={{ status: 'error', message: 'Error 2' }}
        >
          <div />
        </SectionContainer>
        <SectionContainer
          id="hot-posts"
          title="Traveler Discussions"
          state={{ status: 'error', message: 'Error 3' }}
        >
          <div />
        </SectionContainer>
      </div>,
    );

    // Search section is still visible (static)
    expect(document.getElementById('search-entry')).toBeInTheDocument();

    // All error alerts are present
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(3);

    // All error messages are visible
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
    expect(screen.getByText('Error 3')).toBeInTheDocument();

    // No success data-testid elements (no white-screen fallback)
    expect(screen.queryByTestId('success-section')).not.toBeInTheDocument();

    // All section IDs exist (page layout is intact)
    expect(document.getElementById('featured-destinations')).toBeInTheDocument();
    expect(document.getElementById('popular-destinations')).toBeInTheDocument();
    expect(document.getElementById('hot-posts')).toBeInTheDocument();
  });

  it('each section has independent retry handler', () => {
    const retry1 = vi.fn();
    const retry2 = vi.fn();

    render(
      <div>
        <SectionContainer
          id="featured-destinations"
          title="Featured Destinations"
          state={{ status: 'error', message: 'err1' }}
          onRetry={retry1}
        >
          <div />
        </SectionContainer>
        <SectionContainer
          id="popular-destinations"
          title="Popular Destinations"
          state={{ status: 'error', message: 'err2' }}
          onRetry={retry2}
        >
          <div />
        </SectionContainer>
      </div>,
    );

    const retryButtons = screen.getAllByRole('button', { name: /retry/i });
    expect(retryButtons).toHaveLength(2);

    retryButtons[0].click();
    expect(retry1).toHaveBeenCalledTimes(1);
    expect(retry2).toHaveBeenCalledTimes(0);

    retryButtons[1].click();
    expect(retry1).toHaveBeenCalledTimes(1);
    expect(retry2).toHaveBeenCalledTimes(1);
  });
});

// --- Page HTML structure: section order + hero data wiring ---

type ElementProps = { children?: ReactNode; fallback?: ReactNode; id?: string };

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

function makeEnvelope(content: AttractionSummary[]): PageResponse<AttractionSummary> {
  return {
    content,
    page: 0,
    size: 5,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
  };
}

/**
 * Locates the hero's Suspense boundary inside the page element tree by matching
 * the fallback SectionContainer's `featured-destinations` id.
 */
function findHeroBoundary(node: ReactNode): ReactElement<ElementProps> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findHeroBoundary(child);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement<ElementProps>(node)) return null;
  if (node.type === Suspense) {
    const { fallback } = node.props;
    if (isValidElement<ElementProps>(fallback) && fallback.props.id === 'featured-destinations') {
      return node;
    }
  }
  return findHeroBoundary(node.props.children);
}

function heroSectionFrom(boundary: ReactElement<ElementProps>): () => Promise<ReactNode> {
  const child = boundary.props.children;
  if (!isValidElement(child)) throw new Error('Hero Suspense boundary has no element child');
  return child.type as () => Promise<ReactNode>;
}

describe('homepage page structure', () => {
  beforeEach(() => {
    vi.mocked(getAttractions).mockReset();
    vi.mocked(getPopularAttractions).mockReset();
    vi.mocked(getHotPosts).mockReset();
    vi.mocked(getAttractions).mockResolvedValue(makeEnvelope([]));
    vi.mocked(getPopularAttractions).mockResolvedValue([]);
    vi.mocked(getHotPosts).mockResolvedValue([]);
  });

  it('HomePage renders section IDs in correct order including featured-destinations', () => {
    const html = renderToString(<HomePage />);

    const searchIndex = html.indexOf('id="search-entry"');
    const featuredIndex = html.indexOf('id="featured-destinations"');
    const funcNavIndex = html.indexOf('id="function-navigation"');
    const destIndex = html.indexOf('id="popular-destinations"');
    const hotPostsIndex = html.indexOf('id="hot-posts"');

    expect(searchIndex).toBeGreaterThan(-1);
    expect(featuredIndex).toBeGreaterThan(-1);
    expect(funcNavIndex).toBeGreaterThan(-1);
    expect(destIndex).toBeGreaterThan(-1);
    expect(hotPostsIndex).toBeGreaterThan(-1);

    expect(searchIndex).toBeLessThan(featuredIndex);
    expect(featuredIndex).toBeLessThan(funcNavIndex);
    expect(funcNavIndex).toBeLessThan(destIndex);
    expect(destIndex).toBeLessThan(hotPostsIndex);
  });

  it('hero resolves through getAttractions with the rating leaderboard params', async () => {
    vi.mocked(getAttractions).mockResolvedValue(makeEnvelope([makeAttraction()]));

    const boundary = findHeroBoundary(HomePage());
    expect(boundary).not.toBeNull();

    const section = await heroSectionFrom(boundary!)();

    expect(getAttractions).toHaveBeenCalledWith({ sort: 'rating', size: 5 });

    const html = renderToString(<>{section}</>);
    expect(html).toContain('Featured Destinations');
    expect(html).toContain('Forbidden City');
  });

  it('hides the whole hero section (including its title) when the leaderboard is empty', async () => {
    vi.mocked(getAttractions).mockResolvedValue(makeEnvelope([]));

    const boundary = findHeroBoundary(HomePage());
    expect(boundary).not.toBeNull();

    const section = await heroSectionFrom(boundary!)();

    expect(getAttractions).toHaveBeenCalledWith({ sort: 'rating', size: 5 });
    expect(section).toBeNull();
  });
});
