import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomepageHotPosts } from '@/components/home/HomepageHotPosts';
import type { HotPost } from '@/types/home';

const mockPosts: HotPost[] = [
  { id: 1, title: 'Best places in Chengdu', cityName: 'Chengdu', commentCount: 42, createdAt: '2026-08-02T10:00:00Z' },
  { id: 2, title: 'Beijing travel tips', cityName: 'Beijing', commentCount: 15, createdAt: '2026-08-01T12:00:00Z' },
  { id: 3, title: 'Shanghai food guide', cityName: null, commentCount: 0, createdAt: '2026-07-30T08:00:00Z' },
  { id: 4, title: 'Very long post title that should be truncated with CSS class because it is extremely long', cityName: 'Guangzhou', commentCount: 5, createdAt: '2026-07-28T06:00:00Z' },
];

describe('HomepageHotPosts', () => {
  it('renders all post titles', () => {
    render(<HomepageHotPosts posts={mockPosts} />);
    expect(screen.getByText(/Best places/)).toBeInTheDocument();
  });

  it('shows city chip when cityName is present', () => {
    render(<HomepageHotPosts posts={mockPosts} />);
    expect(screen.getByText('Chengdu')).toBeInTheDocument();
    expect(screen.getByText('Beijing')).toBeInTheDocument();
  });

  it('does not show city chip when cityName is null', () => {
    render(<HomepageHotPosts posts={mockPosts} />);
    expect(screen.getByText('Shanghai food guide')).toBeInTheDocument();
  });

  it('shows comment count', () => {
    render(<HomepageHotPosts posts={mockPosts} />);
    expect(screen.getByText('42 comments')).toBeInTheDocument();
    expect(screen.getByText('0 comments')).toBeInTheDocument();
  });

  it('shows relative time', () => {
    const now = new Date('2026-08-02T12:00:00Z');
    render(<HomepageHotPosts posts={mockPosts} now={now} />);
    expect(screen.getByText('2 h ago')).toBeInTheDocument();
  });

  it('long titles have line-clamp CSS class', () => {
    render(<HomepageHotPosts posts={mockPosts} />);
    const longTitle = screen.getByText(/Very long post/);
    expect(longTitle.className).toContain('line-clamp');
  });

  it('post row is a link to /community/post/{id}', () => {
    render(<HomepageHotPosts posts={mockPosts} />);
    const link = screen.getByRole('link', { name: /Best places/ });
    expect(link).toHaveAttribute('href', '/community/post/1');
  });

  it('calls onPostClick on click', async () => {
    const onPostClick = vi.fn();
    render(<HomepageHotPosts posts={mockPosts} onPostClick={onPostClick} />);
    const link = screen.getByRole('link', { name: /Best places/ });
    await userEvent.click(link);
    expect(onPostClick).toHaveBeenCalledWith(1);
  });

  it('shows empty state with CTA when posts is empty', () => {
    render(<HomepageHotPosts posts={[]} />);
    expect(screen.getByText(/Start a Discussion/i)).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /Start a Discussion/i });
    expect(cta).toHaveAttribute('href', '/community/new');
  });
});
