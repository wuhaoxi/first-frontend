import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import PostDetailPage from '@/app/posts/[id]/page';
import { getPostById } from '@/lib/api/posts';
import { postCommentApi, toggleBookmarkState } from '@/lib/api/interactions';
import type { PostResponse } from '@/types/post';

vi.mock('@/lib/api/posts');

vi.mock('@/lib/api/interactions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/interactions')>();
  return { ...actual, toggleBookmarkState: vi.fn() };
});

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { lastCommentSectionProps, lastBookmarkButtonProps } = vi.hoisted(() => ({
  lastCommentSectionProps: {
    current: null as {
      targetId: number;
      commentCount: number;
      api: unknown;
      onCommentMutated: () => void;
    } | null,
  },
  lastBookmarkButtonProps: {
    current: null as { active: boolean | null; toggle: () => Promise<unknown> } | null,
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

vi.mock('@/components/post/VoteButtons', () => ({
  default: ({ postId }: { postId: number }) => <div data-testid="vote-buttons" data-post-id={postId} />,
}));

vi.mock('@/components/post/BookmarkButton', () => ({
  default: (props: { active: boolean | null; toggle: () => Promise<unknown> }) => {
    lastBookmarkButtonProps.current = props;
    return <div data-testid="bookmark-button" data-active={String(props.active)} />;
  },
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
    lastBookmarkButtonProps.current = null;
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
    expect(screen.getByTestId('bookmark-button').getAttribute('data-active')).toBe('true');
    expect(typeof lastBookmarkButtonProps.current?.toggle).toBe('function');
  });

  it('passes targetId, commentCount and postCommentApi to CommentSection and syncs count via onCommentMutated', async () => {
    vi.mocked(getPostById)
      .mockResolvedValueOnce(post({ commentCount: 3 }))
      .mockResolvedValueOnce(post({ commentCount: 4 }));

    render(<PostDetailPage params={{ id: '42' }} />);

    await screen.findByText('Wiring post');
    expect(lastCommentSectionProps.current?.targetId).toBe(42);
    expect(lastCommentSectionProps.current?.commentCount).toBe(3);
    expect(lastCommentSectionProps.current?.api).toBe(postCommentApi);
    expect(typeof lastCommentSectionProps.current?.onCommentMutated).toBe('function');

    await act(async () => {
      lastCommentSectionProps.current?.onCommentMutated();
    });

    expect(await screen.findByText('Comments: 4')).toBeInTheDocument();
    await waitFor(() => {
      expect(getPostById).toHaveBeenCalledTimes(2);
    });
  });

  it('binds the BookmarkButton toggle to toggleBookmarkState with the post id', async () => {
    vi.mocked(getPostById).mockResolvedValue(post({ bookmarked: false }));
    vi.mocked(toggleBookmarkState).mockResolvedValue({ ok: true, data: true, message: null });

    render(<PostDetailPage params={{ id: '42' }} />);

    await screen.findByText('Wiring post');

    await act(async () => {
      await lastBookmarkButtonProps.current?.toggle();
    });

    expect(toggleBookmarkState).toHaveBeenCalledWith(42);
  });

  it('shows the not-found state when fetching fails', async () => {
    vi.mocked(getPostById).mockRejectedValue(new Error('404: Post not found'));

    render(<PostDetailPage params={{ id: '999' }} />);

    expect(await screen.findByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
    expect(screen.getByText('404: Post not found')).toBeInTheDocument();
  });
});
