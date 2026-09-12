import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostCard } from '@/components/PostCard';
import type { PostSummary } from '@/types/post';

const BASE_POST: PostSummary = {
  id: 7,
  title: 'A travel story',
  coverImage: null,
  tags: ['travel'],
  authorId: 1,
  commentCount: 3,
  upVoteCount: 5,
  bookmarkCount: 2,
  createdAt: '2026-09-03T00:45:47.631831',
  updatedAt: '2026-09-03T00:45:47.631831',
};

describe('PostCard', () => {
  it('renders upvote, comment and bookmark counts with accessible labels', () => {
    render(<PostCard post={BASE_POST} />);

    expect(screen.getByLabelText('Upvotes')).toHaveTextContent('5');
    expect(screen.getByLabelText('Comments')).toHaveTextContent('3');
    expect(screen.getByLabelText('Bookmarks')).toHaveTextContent('2');
  });

  it('hides all statistics when every count is zero and keeps the relative time', () => {
    render(
      <PostCard post={{ ...BASE_POST, upVoteCount: 0, commentCount: 0, bookmarkCount: 0 }} />
    );

    expect(screen.queryByLabelText('Upvotes')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Comments')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Bookmarks')).not.toBeInTheDocument();
    expect(screen.getByText(/ago|just now/)).toBeInTheDocument();
  });

  it('renders only the non-zero statistics', () => {
    render(
      <PostCard post={{ ...BASE_POST, upVoteCount: 0, commentCount: 3, bookmarkCount: 2 }} />
    );

    expect(screen.queryByLabelText('Upvotes')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Comments')).toHaveTextContent('3');
    expect(screen.getByLabelText('Bookmarks')).toHaveTextContent('2');
  });

  it('formats large counts compactly', () => {
    render(<PostCard post={{ ...BASE_POST, upVoteCount: 1200 }} />);

    expect(screen.getByLabelText('Upvotes')).toHaveTextContent('1.2k');
  });

  it('links to the post detail page', () => {
    render(<PostCard post={BASE_POST} />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/posts/7');
  });
});
