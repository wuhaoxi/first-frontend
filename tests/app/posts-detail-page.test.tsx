import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import PostDetailPage from '@/app/posts/[id]/page';
import { getPostById } from '@/lib/api/posts';
import type { PostResponse } from '@/types/post';

vi.mock('@/lib/api/posts');

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { lastCommentSectionProps } = vi.hoisted(() => ({
  lastCommentSectionProps: { current: null as { postId: number; commentCount: number; onCommentMutated: () => void } | null },
}));

vi.mock('@/components/post/CommentSection', () => ({
  default: (props: { postId: number; commentCount: number; onCommentMutated: () => void }) => {
    lastCommentSectionProps.current = props;
    return <div data-testid="comment-section">Comment section</div>;
  },
}));

vi.mock('@/components/post/VoteButtons', () => ({
  default: ({ postId }: { postId: number }) => <div data-testid="vote-buttons" data-post-id={postId} />,
}));

vi.mock('@/components/post/BookmarkButton', () => ({
  default: ({ postId, bookmarked }: { postId: number; bookmarked: boolean | null }) => (
    <div data-testid="bookmark-button" data-post-id={postId} data-bookmarked={String(bookmarked)} />
  ),
}));

function post(overrides: Partial<PostResponse> = {}): PostResponse {
  return {
    id: 42,
    title: 'Wiring post',
    content: 'Hello from markdown',
    coverImage: null,
    tags: ['java'],
    status: 'PUBLISHED',
    authorId: 7,
    commentCount: 3,
    bookmarked: null,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    ...overrides,
  };
}

describe('PostDetailPage (interaction wiring)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    lastCommentSectionProps.current = null;
  });

  it('renders post content after loading', async () => {
    vi.mocked(getPostById).mockResolvedValue(post());

    render(<PostDetailPage params={{ id: '42' }} />);

    expect(await screen.findByText('Wiring post')).toBeInTheDocument();
    expect(screen.getByText('Hello from markdown')).toBeInTheDocument();
    expect(screen.getByText('Author #7')).toBeInTheDocument();
    expect(screen.getByText('Comments: 3')).toBeInTheDocument();
    expect(getPostById).toHaveBeenCalledWith(42);
  });

  it('renders VoteButtons and BookmarkButton in the controls row with post props', async () => {
    vi.mocked(getPostById).mockResolvedValue(post({ bookmarked: true }));

    render(<PostDetailPage params={{ id: '42' }} />);

    await screen.findByText('Wiring post');
    expect(screen.getByTestId('vote-buttons').getAttribute('data-post-id')).toBe('42');
    expect(screen.getByTestId('bookmark-button').getAttribute('data-post-id')).toBe('42');
    expect(screen.getByTestId('bookmark-button').getAttribute('data-bookmarked')).toBe('true');
  });

  it('passes postId and commentCount to CommentSection and syncs count via onCommentMutated', async () => {
    vi.mocked(getPostById)
      .mockResolvedValueOnce(post({ commentCount: 3 }))
      .mockResolvedValueOnce(post({ commentCount: 4 }));

    render(<PostDetailPage params={{ id: '42' }} />);

    await screen.findByText('Wiring post');
    expect(lastCommentSectionProps.current?.postId).toBe(42);
    expect(lastCommentSectionProps.current?.commentCount).toBe(3);
    expect(typeof lastCommentSectionProps.current?.onCommentMutated).toBe('function');

    await act(async () => {
      lastCommentSectionProps.current?.onCommentMutated();
    });

    expect(await screen.findByText('Comments: 4')).toBeInTheDocument();
    await waitFor(() => {
      expect(getPostById).toHaveBeenCalledTimes(2);
    });
  });

  it('shows the not-found state when fetching fails', async () => {
    vi.mocked(getPostById).mockRejectedValue(new Error('404: Post not found'));

    render(<PostDetailPage params={{ id: '999' }} />);

    expect(await screen.findByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
    expect(screen.getByText('404: Post not found')).toBeInTheDocument();
  });
});
