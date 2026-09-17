import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttractionsPage from '@/app/attractions/page';
import { getAttractions } from '@/lib/api/attractions';
import type { AttractionSummary } from '@/types/attraction';
import type { PageResponse } from '@/types/interactions';

vi.mock('@/lib/api/attractions');

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root: Element | Document | null = null;
  readonly rootMargin = '200px 0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn((): IntersectionObserverEntry[] => []);

  constructor(private readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting = true): void {
    if (this.disconnect.mock.calls.length > 0) {
      return;
    }
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this);
  }
}

async function triggerIntersection(): Promise<void> {
  await act(async () => {
    const observer =
      MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
    observer?.trigger();
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeAttraction(id: number, name: string, overrides: Partial<AttractionSummary> = {}): AttractionSummary {
  return {
    id,
    createdAt: '2026-09-01T12:00:00Z',
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    nameZh: `${name}中文`,
    category: 'HISTORICAL_SITE',
    tags: [],
    city: 'Beijing',
    citySlug: 'beijing',
    summary: `Summary of ${name}`,
    coverImageUrl: null,
    bookingRequired: false,
    ratingScore: 4.9,
    favoriteCount: 5100,
    heatScore: 98,
    ...overrides,
  };
}

function makeEnvelope(overrides: Partial<PageResponse<AttractionSummary>> = {}): PageResponse<AttractionSummary> {
  return {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    ...overrides,
  };
}

describe('AttractionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAttractions).mockReset();
    MockIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('fetches the first page and renders a card per item in order', async () => {
    vi.mocked(getAttractions).mockResolvedValue(
      makeEnvelope({
        content: [makeAttraction(2, 'Great Wall'), makeAttraction(1, 'Forbidden City')],
        totalElements: 2,
        totalPages: 1,
      })
    );

    render(<AttractionsPage />);

    expect(await screen.findByText('Great Wall')).toBeInTheDocument();
    expect(screen.getByText('Forbidden City')).toBeInTheDocument();
    expect(getAttractions).toHaveBeenCalledWith({ page: 0, size: 20 });

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('Great Wall');
    expect(headings[1]).toHaveTextContent('Forbidden City');
  });

  it('renders city and category chip rows with All active by default', async () => {
    vi.mocked(getAttractions).mockResolvedValue(
      makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], totalPages: 1 })
    );

    render(<AttractionsPage />);
    await screen.findByText('Forbidden City');

    expect(screen.getByRole('button', { name: 'Beijing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Xi'an" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Museum' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nature' })).toBeInTheDocument();

    expect(screen.getAllByRole('button', { name: 'All' })[0]).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Beijing' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('refetches page 0 with the city filter and replaces the list', async () => {
    vi.mocked(getAttractions)
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makeAttraction(1, 'Forbidden City')],
          totalElements: 2,
          totalPages: 2,
        })
      )
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makeAttraction(3, 'West Lake')], totalPages: 1 })
      );

    render(<AttractionsPage />);
    await screen.findByText('Forbidden City');

    await userEvent.click(screen.getByRole('button', { name: 'Hangzhou' }));

    expect(await screen.findByText('West Lake')).toBeInTheDocument();
    expect(getAttractions).toHaveBeenLastCalledWith({ city: 'hangzhou', page: 0, size: 20 });
    expect(screen.queryByText('Forbidden City')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hangzhou' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('refetches page 0 with the category filter', async () => {
    vi.mocked(getAttractions)
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], totalPages: 1 })
      )
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makeAttraction(4, 'Shanghai Museum', { category: 'MUSEUM' })],
          totalPages: 1,
        })
      );

    render(<AttractionsPage />);
    await screen.findByText('Forbidden City');

    await userEvent.click(screen.getByRole('button', { name: 'Museum' }));

    expect(await screen.findByText('Shanghai Museum')).toBeInTheDocument();
    expect(getAttractions).toHaveBeenLastCalledWith({ category: 'MUSEUM', page: 0, size: 20 });
  });

  it('combines city and category filters', async () => {
    vi.mocked(getAttractions)
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], totalPages: 1 })
      )
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makeAttraction(2, 'Great Wall')], totalPages: 1 })
      )
      .mockResolvedValueOnce(makeEnvelope({ content: [makeAttraction(5, 'Beijing Museum')], totalPages: 1 }));

    render(<AttractionsPage />);
    await screen.findByText('Forbidden City');

    await userEvent.click(screen.getByRole('button', { name: 'Beijing' }));
    await screen.findByText('Great Wall');

    await userEvent.click(screen.getByRole('button', { name: 'Museum' }));

    expect(await screen.findByText('Beijing Museum')).toBeInTheDocument();
    expect(getAttractions).toHaveBeenLastCalledWith({
      city: 'beijing',
      category: 'MUSEUM',
      page: 0,
      size: 20,
    });
  });

  it('resets to "All" when clicking the active All chips', async () => {
    vi.mocked(getAttractions).mockResolvedValue(
      makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], totalPages: 1 })
    );

    render(<AttractionsPage />);
    await screen.findByText('Forbidden City');

    const allChips = screen.getAllByRole('button', { name: 'All' });
    await userEvent.click(allChips[0]);
    await userEvent.click(allChips[1]);

    // Already unfiltered — no extra fetches beyond the initial "All"-only call
    expect(getAttractions).toHaveBeenCalledTimes(1);
    expect(getAttractions).toHaveBeenCalledWith({ page: 0, size: 20 });
  });

  it('auto-loads the next page when the sentinel becomes visible and appends items', async () => {
    vi.mocked(getAttractions)
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makeAttraction(2, 'Great Wall')],
          totalElements: 2,
          totalPages: 2,
        })
      )
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], page: 1, totalPages: 2 })
      );

    render(<AttractionsPage />);
    await screen.findByText('Great Wall');

    await triggerIntersection();

    expect(await screen.findByText('Forbidden City')).toBeInTheDocument();
    expect(getAttractions).toHaveBeenLastCalledWith({ page: 1, size: 20 });
    expect(screen.getByText('Great Wall')).toBeInTheDocument();
  });

  it('issues exactly one auto-load request while one is in flight', async () => {
    const loadMoreDeferred = deferred<PageResponse<AttractionSummary>>();
    vi.mocked(getAttractions)
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makeAttraction(2, 'Great Wall')],
          totalElements: 2,
          totalPages: 2,
        })
      )
      .mockReturnValueOnce(loadMoreDeferred.promise);

    render(<AttractionsPage />);
    await screen.findByText('Great Wall');

    await triggerIntersection();
    expect(vi.mocked(getAttractions)).toHaveBeenCalledTimes(2);

    await triggerIntersection();
    expect(vi.mocked(getAttractions)).toHaveBeenCalledTimes(2);

    await act(async () => {
      loadMoreDeferred.resolve(
        makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], page: 1, totalPages: 2 })
      );
    });
    expect(await screen.findByText('Forbidden City')).toBeInTheDocument();
  });

  it('shows three skeleton cards while an auto-load is in flight', async () => {
    const loadMoreDeferred = deferred<PageResponse<AttractionSummary>>();
    vi.mocked(getAttractions)
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makeAttraction(2, 'Great Wall')],
          totalElements: 2,
          totalPages: 2,
        })
      )
      .mockReturnValueOnce(loadMoreDeferred.promise);

    const { container } = render(<AttractionsPage />);
    await screen.findByText('Great Wall');

    await triggerIntersection();

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);

    await act(async () => {
      loadMoreDeferred.resolve(
        makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], page: 1, totalPages: 2 })
      );
    });

    expect(await screen.findByText('Forbidden City')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(0);
  });

  it('shows the end-of-list indicator when page + 1 >= totalPages', async () => {
    vi.mocked(getAttractions).mockResolvedValue(
      makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], totalPages: 1 })
    );

    render(<AttractionsPage />);
    await screen.findByText('Forbidden City');

    expect(screen.getByText("You've reached the end")).toBeInTheDocument();
  });

  it('skips duplicate ids when appending a page', async () => {
    vi.mocked(getAttractions)
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makeAttraction(2, 'Great Wall')],
          totalElements: 2,
          totalPages: 2,
        })
      )
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makeAttraction(2, 'Great Wall'), makeAttraction(1, 'Forbidden City')],
          page: 1,
          totalPages: 2,
        })
      );

    render(<AttractionsPage />);
    await screen.findByText('Great Wall');

    await triggerIntersection();

    expect(await screen.findByText('Forbidden City')).toBeInTheDocument();
    expect(screen.getAllByText('Great Wall')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('discards a stale auto-load response after the city filter changes', async () => {
    const staleDeferred = deferred<PageResponse<AttractionSummary>>();
    vi.mocked(getAttractions)
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makeAttraction(2, 'Great Wall')],
          totalElements: 2,
          totalPages: 2,
        })
      )
      .mockReturnValueOnce(staleDeferred.promise)
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makeAttraction(3, 'West Lake')], totalPages: 1 })
      );

    render(<AttractionsPage />);
    await screen.findByText('Great Wall');

    await triggerIntersection();

    await userEvent.click(screen.getByRole('button', { name: 'Hangzhou' }));
    expect(await screen.findByText('West Lake')).toBeInTheDocument();

    await act(async () => {
      staleDeferred.resolve(
        makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], page: 1, totalPages: 2 })
      );
    });

    expect(screen.queryByText('Forbidden City')).not.toBeInTheDocument();
    expect(screen.getByText('West Lake')).toBeInTheDocument();
  });

  it('offers a retry after an auto-load failure and resumes auto-loading', async () => {
    vi.mocked(getAttractions)
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makeAttraction(2, 'Great Wall')],
          totalElements: 3,
          totalPages: 3,
        })
      )
      .mockRejectedValueOnce(new Error('500: Load failed'))
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], page: 1, totalPages: 3 })
      )
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makeAttraction(9, 'Temple of Heaven')], page: 2, totalPages: 3 })
      );

    render(<AttractionsPage />);
    await screen.findByText('Great Wall');

    await triggerIntersection();
    expect(await screen.findByText('500: Load failed')).toBeInTheDocument();
    expect(vi.mocked(getAttractions)).toHaveBeenCalledTimes(2);

    await triggerIntersection();
    expect(vi.mocked(getAttractions)).toHaveBeenCalledTimes(2);

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Forbidden City')).toBeInTheDocument();
    expect(screen.queryByText('500: Load failed')).not.toBeInTheDocument();

    await triggerIntersection();

    expect(await screen.findByText('Temple of Heaven')).toBeInTheDocument();
    expect(getAttractions).toHaveBeenLastCalledWith({ page: 2, size: 20 });
  });

  it('shows the empty state when no attractions match', async () => {
    vi.mocked(getAttractions).mockResolvedValue(makeEnvelope());

    render(<AttractionsPage />);

    expect(await screen.findByText('No attractions found')).toBeInTheDocument();
  });

  it('shows an error message and retries on demand', async () => {
    vi.mocked(getAttractions)
      .mockRejectedValueOnce(new Error('500: Server error'))
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makeAttraction(1, 'Forbidden City')], totalPages: 1 })
      );

    render(<AttractionsPage />);

    expect(await screen.findByText('500: Server error')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Forbidden City')).toBeInTheDocument();
    expect(getAttractions).toHaveBeenCalledTimes(2);
  });

  it('renders no manual load-more control', async () => {
    vi.mocked(getAttractions).mockResolvedValue(
      makeEnvelope({ content: [makeAttraction(2, 'Great Wall')], totalElements: 2, totalPages: 2 })
    );

    render(<AttractionsPage />);
    await screen.findByText('Great Wall');

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });
});
