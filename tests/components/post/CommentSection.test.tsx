import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentSection from '@/components/post/CommentSection';
import * as interactions from '@/lib/api/interactions';
import * as usersApi from '@/lib/api/users';
import type { CommentResponse, PageResponse } from '@/types/interactions';

vi.mock('@/lib/api/interactions');
vi.mock('@/lib/api/users');
vi.mock('@/components/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

type AuthState = {
  user: { id: number; name: string; email: string } | null;
  isLoading: boolean;
};

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn<() => AuthState>(() => ({
    user: { id: 1, name: 'Charlie', email: 'c@x.com' },
    isLoading: false,
  })),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const NAMES: Record<number, string> = { 1: 'Charlie', 2: 'Alice', 3: 'Dave' };

function comment(overrides: Partial<CommentResponse> = {}): CommentResponse {
  return {
    id: 10,
    postId: 1,
    userId: 2,
    content: 'Great read!',
    parentCommentId: null,
    replyCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function page(items: CommentResponse[], totalElements: number, pageNum = 0, size = 20): PageResponse<CommentResponse> {
  return {
    content: items,
    page: pageNum,
    size,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / size)),
  };
}

function ok(data: PageResponse<CommentResponse> | null) {
  return { ok: true as const, data, message: null };
}

function fail(message: string) {
  return { ok: false as const, data: null, message };
}

const topLevel1 = comment({ id: 10, userId: 2, content: 'Great read!', replyCount: 2 });
const reply1 = comment({ id: 11, userId: 1, content: 'Agreed!', parentCommentId: 10, replyCount: 1 });
const reply2 = comment({ id: 12, userId: 3, content: 'Thanks for sharing', parentCommentId: 10, replyCount: 0 });
const topLevel2 = comment({ id: 13, userId: 3, content: 'Second top-level comment', replyCount: 0 });

function mockUsers() {
  vi.mocked(usersApi.getUserById).mockImplementation(async (id: number) => ({
    id,
    name: NAMES[id] ?? `user${id}`,
    email: `${id}@x.com`,
  }));
}

describe('CommentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockImplementation(() => ({
      user: { id: 1, name: 'Charlie', email: 'c@x.com' },
      isLoading: false,
    }));
    mockUsers();
  });

  it('shows skeletons while the initial request is in flight', () => {
    vi.mocked(interactions.getTopLevelComments).mockReturnValue(new Promise(() => {}));

    render(<CommentSection postId={1} commentCount={3} onCommentMutated={vi.fn()} />);

    expect(screen.getByTestId('comments-skeleton')).toBeInTheDocument();
  });

  it('loads top-level comments and renders author names', async () => {
    vi.mocked(interactions.getTopLevelComments).mockResolvedValue(ok(page([topLevel1], 1)));

    render(<CommentSection postId={1} commentCount={3} onCommentMutated={vi.fn()} />);

    expect(await screen.findByText('Great read!')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(interactions.getTopLevelComments).toHaveBeenCalledWith(1, 0, 20);
    expect(screen.getByText('Comments (3)')).toBeInTheDocument();
  });

  it('auto-loads replies of top-level comments in parallel and renders layer 2', async () => {
    vi.mocked(interactions.getTopLevelComments).mockResolvedValue(ok(page([topLevel1], 1)));
    vi.mocked(interactions.getReplies).mockResolvedValue(ok(page([reply1, reply2], 2)));

    render(<CommentSection postId={1} commentCount={3} onCommentMutated={vi.fn()} />);

    expect(await screen.findByText('Agreed!')).toBeInTheDocument();
    expect(screen.getByText('Thanks for sharing')).toBeInTheDocument();
    expect(interactions.getReplies).toHaveBeenCalledWith(10, 0, 20);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Dave')).toBeInTheDocument();
  });

  it('falls back to "User #n" when a name lookup fails', async () => {
    vi.mocked(interactions.getTopLevelComments).mockResolvedValue(ok(page([topLevel1], 1)));
    vi.mocked(interactions.getReplies).mockResolvedValue(ok(page([reply2], 1)));
    vi.mocked(usersApi.getUserById).mockRejectedValue(new Error('gone'));

    render(<CommentSection postId={1} commentCount={3} onCommentMutated={vi.fn()} />);

    expect(await screen.findByText('Thanks for sharing')).toBeInTheDocument();
    expect(screen.getByText('User #3')).toBeInTheDocument();
  });

  it('renders the empty state when the post has no comments', async () => {
    vi.mocked(interactions.getTopLevelComments).mockResolvedValue(ok(page([], 0)));

    render(<CommentSection postId={1} commentCount={0} onCommentMutated={vi.fn()} />);

    expect(
      await screen.findByText('No comments yet. Be the first to share your thoughts!')
    ).toBeInTheDocument();
  });

  it('shows an error with Retry when loading fails, then recovers', async () => {
    vi.mocked(interactions.getTopLevelComments)
      .mockResolvedValueOnce(fail('Could not load'))
      .mockResolvedValueOnce(ok(page([topLevel1], 1)));

    render(<CommentSection postId={1} commentCount={1} onCommentMutated={vi.fn()} />);

    expect(await screen.findByText('Could not load')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Great read!')).toBeInTheDocument();
  });

  it('loads more top-level comments with the Load more button', async () => {
    vi.mocked(interactions.getTopLevelComments)
      .mockResolvedValueOnce(ok(page([topLevel1], 2, 0, 1)))
      .mockResolvedValueOnce(ok(page([topLevel2], 2, 1, 1)));

    render(<CommentSection postId={1} commentCount={2} onCommentMutated={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Load more comments' }));

    expect(await screen.findByText('Second top-level comment')).toBeInTheDocument();
    expect(interactions.getTopLevelComments).toHaveBeenLastCalledWith(1, 1, 20);
  });

  it('loads more replies inside a thread', async () => {
    vi.mocked(interactions.getTopLevelComments).mockResolvedValue(ok(page([topLevel1], 1)));
    const extraReply = comment({ id: 14, userId: 2, content: 'One more reply', parentCommentId: 10, replyCount: 0 });
    vi.mocked(interactions.getReplies)
      .mockResolvedValueOnce(ok(page([reply1], 2, 0, 1)))
      .mockResolvedValueOnce(ok(page([extraReply], 2, 1, 1)));

    render(<CommentSection postId={1} commentCount={3} onCommentMutated={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Load more replies' }));

    expect(await screen.findByText('One more reply')).toBeInTheDocument();
    expect(interactions.getReplies).toHaveBeenLastCalledWith(10, 1, 20);
  });

  it('posts a top-level comment and refreshes the list', async () => {
    const newComment = comment({ id: 20, userId: 1, content: 'My new comment', replyCount: 0 });
    vi.mocked(interactions.getTopLevelComments)
      .mockResolvedValueOnce(ok(page([], 0)))
      .mockResolvedValueOnce(ok(page([newComment], 1)));
    vi.mocked(interactions.createComment).mockResolvedValue({
      ok: true,
      data: newComment,
      message: null,
    });
    const onCommentMutated = vi.fn();

    render(<CommentSection postId={1} commentCount={0} onCommentMutated={onCommentMutated} />);

    const input = await screen.findByPlaceholderText(/write a comment/i);
    await userEvent.type(input, 'My new comment');
    await userEvent.click(screen.getByRole('button', { name: /post/i }));

    expect(await screen.findByText('My new comment')).toBeInTheDocument();
    expect(interactions.createComment).toHaveBeenCalledWith(1, 'My new comment');
    expect(onCommentMutated).toHaveBeenCalled();
  });

  it('replies to a top-level comment in reply mode', async () => {
    const newReply = comment({ id: 21, userId: 1, content: 'My reply', parentCommentId: 10, replyCount: 0 });
    vi.mocked(interactions.getTopLevelComments).mockResolvedValue(ok(page([topLevel1], 1)));
    vi.mocked(interactions.getReplies).mockResolvedValue(ok(page([], 0)));
    vi.mocked(interactions.createReply).mockResolvedValue({ ok: true, data: newReply, message: null });
    const onCommentMutated = vi.fn();

    render(<CommentSection postId={1} commentCount={2} onCommentMutated={onCommentMutated} />);

    const replyButton = await screen.findByRole('button', { name: 'Reply' });
    await userEvent.click(replyButton);

    expect(
      screen.getAllByText((_, element) => element?.textContent === 'Replying to Alice').length
    ).toBeGreaterThan(0);

    const input = screen.getByPlaceholderText(/write a comment/i);
    await userEvent.type(input, 'My reply');
    await userEvent.click(screen.getByRole('button', { name: /post/i }));

    await waitFor(() => {
      expect(interactions.createReply).toHaveBeenCalledWith(10, 'My reply');
    });
    expect(onCommentMutated).toHaveBeenCalled();
  });

  it('deletes an own top-level comment and refreshes', async () => {
    const myComment = comment({ id: 30, userId: 1, content: 'Delete me', replyCount: 0 });
    vi.mocked(interactions.getTopLevelComments)
      .mockResolvedValueOnce(ok(page([myComment], 1)))
      .mockResolvedValueOnce(ok(page([], 0)));
    vi.mocked(interactions.deleteComment).mockResolvedValue({ ok: true, data: null, message: null });
    const onCommentMutated = vi.fn();

    render(<CommentSection postId={1} commentCount={1} onCommentMutated={onCommentMutated} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete comment' }));

    await waitFor(() => {
      expect(interactions.deleteComment).toHaveBeenCalledWith(30);
    });
    expect(onCommentMutated).toHaveBeenCalled();
    expect(await screen.findByText('No comments yet. Be the first to share your thoughts!')).toBeInTheDocument();
  });

  it('keeps the comment and shows an error when delete fails', async () => {
    const myComment = comment({ id: 30, userId: 1, content: 'Keep me', replyCount: 0 });
    vi.mocked(interactions.getTopLevelComments).mockResolvedValue(ok(page([myComment], 1)));
    vi.mocked(interactions.deleteComment).mockResolvedValue(fail('Could not delete'));

    render(<CommentSection postId={1} commentCount={1} onCommentMutated={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete comment' }));

    expect(await screen.findByText('Could not delete')).toBeInTheDocument();
    expect(screen.getByText('Keep me')).toBeInTheDocument();
  });
});
