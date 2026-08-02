import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { SectionContainer } from '@/components/home/SectionContainer';

// Mock next/navigation for SSR rendering of client components
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import HomePage from '@/app/page';

// --- Section order + composition isolation ---

describe('homepage section composition', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders sections in correct order (search-entry → editors-picks → function-navigation → popular-destinations → hot-posts)', () => {
    render(
      <div>
        <section id="search-entry" data-testid="section">
          <span>search</span>
        </section>
        <SectionContainer id="editors-picks" title="Editor's Picks" state={{ status: 'success', data: [] }}>
          <div data-testid="content">editors-picks-content</div>
        </SectionContainer>
        <section id="function-navigation" data-testid="section">
          <span>nav</span>
        </section>
        <SectionContainer id="popular-destinations" title="Popular Destinations" state={{ status: 'success', data: [] }}>
          <div data-testid="content">destinations-content</div>
        </SectionContainer>
        <SectionContainer id="hot-posts" title="Hot Posts" state={{ status: 'success', data: [] }}>
          <div data-testid="content">hot-posts-content</div>
        </SectionContainer>
      </div>,
    );

    const sections = document.querySelectorAll('section');
    const ids = Array.from(sections).map((s) => s.id);

    expect(ids).toEqual([
      'search-entry',
      'editors-picks',
      'function-navigation',
      'popular-destinations',
      'hot-posts',
    ]);
  });

  it('single-section failure does not affect other sections', () => {
    render(
      <div>
        <SectionContainer id="editors-picks" title="Editor's Picks" state={{ status: 'success', data: [] }}>
          <div data-testid="success-section">guides loaded</div>
        </SectionContainer>
        <SectionContainer
          id="popular-destinations"
          title="Popular Destinations"
          state={{ status: 'error', message: 'Failed to load destinations' }}
        >
          <div />
        </SectionContainer>
        <SectionContainer id="hot-posts" title="Hot Posts" state={{ status: 'success', data: [] }}>
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
          id="editors-picks"
          title="Editor's Picks"
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
          title="Hot Posts"
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
    expect(document.getElementById('editors-picks')).toBeInTheDocument();
    expect(document.getElementById('popular-destinations')).toBeInTheDocument();
    expect(document.getElementById('hot-posts')).toBeInTheDocument();
  });

  it('each section has independent retry handler', () => {
    const retry1 = vi.fn();
    const retry2 = vi.fn();

    render(
      <div>
        <SectionContainer
          id="editors-picks"
          title="Editor's Picks"
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

// --- Page HTML structure: section order ---
describe('homepage page structure', () => {
  it('HomePage renders section IDs in correct order', () => {
    const html = renderToString(<HomePage />);

    // Verify section IDs appear in the correct order in the HTML
    const searchIndex = html.indexOf('id="search-entry"');
    const editorsIndex = html.indexOf('id="editors-picks"');
    const funcNavIndex = html.indexOf('id="function-navigation"');
    const destIndex = html.indexOf('id="popular-destinations"');
    const hotPostsIndex = html.indexOf('id="hot-posts"');

    expect(searchIndex).toBeGreaterThan(-1);
    expect(editorsIndex).toBeGreaterThan(-1);
    expect(funcNavIndex).toBeGreaterThan(-1);
    expect(destIndex).toBeGreaterThan(-1);
    expect(hotPostsIndex).toBeGreaterThan(-1);

    // Verify correct ordering
    expect(searchIndex).toBeLessThan(editorsIndex);
    expect(editorsIndex).toBeLessThan(funcNavIndex);
    expect(funcNavIndex).toBeLessThan(destIndex);
    expect(destIndex).toBeLessThan(hotPostsIndex);
  });
});
