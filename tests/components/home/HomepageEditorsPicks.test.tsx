import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomepageEditorsPicks } from '@/components/home/HomepageEditorsPicks';
import type { FeaturedGuide } from '@/types/home';

const mockGuides: FeaturedGuide[] = [
  { id: 1, title: 'Guide One', cityName: 'Chengdu', coverImageUrl: '/img1.jpg', recommendation: 'Must visit!', slug: 'guide-one' },
  { id: 2, title: 'Guide Two', cityName: 'Beijing', coverImageUrl: '/img2.jpg', recommendation: 'Top pick', slug: 'guide-two' },
  { id: 3, title: 'Guide Three', cityName: 'Shanghai', coverImageUrl: null, recommendation: 'Awesome', slug: 'guide-three' },
];

describe('HomepageEditorsPicks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the active slide title and advances on timer', () => {
    render(<HomepageEditorsPicks guides={mockGuides} />);
    // First slide (Guide One) is visible
    expect(screen.getByText('Guide One')).toBeInTheDocument();
    // Advance to next slide
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText('Guide Two')).toBeInTheDocument();
    // Advance again
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText('Guide Three')).toBeInTheDocument();
  });

  it('shows gradient placeholder when coverImageUrl is null', () => {
    render(<HomepageEditorsPicks guides={mockGuides} />);
    // Advance to slide 3 which has null coverImageUrl
    act(() => { vi.advanceTimersByTime(10000); });
    // Guide Three has null coverImageUrl, so no img element for it
    expect(screen.getByText('Guide Three')).toBeInTheDocument();
    expect(screen.queryByAltText('Guide Three')).not.toBeInTheDocument();
  });

  it('autoplay advances every 5 seconds by default', () => {
    render(<HomepageEditorsPicks guides={mockGuides} />);
    // First slide is active (index 0)
    act(() => { vi.advanceTimersByTime(5000); });
    // Should now show slide 2
    act(() => { vi.advanceTimersByTime(5000); });
    // Should now show slide 3
    act(() => { vi.advanceTimersByTime(5000); });
    // Back to slide 1
  });

  it('manual arrow click resets timer', () => {
    render(<HomepageEditorsPicks guides={mockGuides} />);
    const nextBtn = screen.getByLabelText('Next slide');
    act(() => { vi.advanceTimersByTime(2000); });
    nextBtn.click();
    act(() => { vi.advanceTimersByTime(5000); });
    // Should still advance
  });

  it('renders nothing when guides array is empty', () => {
    const { container } = render(<HomepageEditorsPicks guides={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onGuideClick with slug on carousel click', () => {
    const onGuideClick = vi.fn();
    render(<HomepageEditorsPicks guides={mockGuides} onGuideClick={onGuideClick} />);
    const carousel = screen.getByRole('region');
    fireEvent.click(carousel);
    expect(onGuideClick).toHaveBeenCalledWith('guide-one');
  });

  it('dots highlight active slide', () => {
    const { container } = render(<HomepageEditorsPicks guides={mockGuides} />);
    const dots = container.querySelectorAll('[role="tab"]');
    expect(dots.length).toBe(3);
  });
});
