import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarkButton from '@/components/post/BookmarkButton';
import * as interactions from '@/lib/api/interactions';

vi.mock('@/lib/api/interactions');
vi.mock('@/components/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

function ok(bookmarked: boolean) {
  return { ok: true as const, data: { bookmarked }, message: null };
}

function fail(message: string) {
  return { ok: false as const, data: null, message };
}

describe('BookmarkButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockPush.mockClear();
    mockAuth.mockImplementation(() => ({
      user: { id: 1, name: 'Alice', email: 'a@x.com' },
      isLoading: false,
    }));
  });

  it('renders pressed state when already bookmarked', () => {
    render(<BookmarkButton postId={1} bookmarked={true} />);

    expect(screen.getByRole('button', { name: /bookmark/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders unpressed state when not bookmarked', () => {
    render(<BookmarkButton postId={1} bookmarked={false} />);

    expect(screen.getByRole('button', { name: /bookmark/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders unpressed state when bookmarked is unknown (guest)', () => {
    render(<BookmarkButton postId={1} bookmarked={null} />);

    expect(screen.getByRole('button', { name: /bookmark/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles optimistically and reconciles with the server response', async () => {
    vi.mocked(interactions.toggleBookmark).mockResolvedValue(ok(true));

    render(<BookmarkButton postId={1} bookmarked={false} />);

    await userEvent.click(screen.getByRole('button', { name: /bookmark/i }));

    expect(screen.getByRole('button', { name: /bookmark/i })).toHaveAttribute('aria-pressed', 'true');
    expect(interactions.toggleBookmark).toHaveBeenCalledWith(1);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bookmark/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('flips back off when toggling a bookmarked post', async () => {
    vi.mocked(interactions.toggleBookmark).mockResolvedValue(ok(false));

    render(<BookmarkButton postId={1} bookmarked={true} />);

    await userEvent.click(screen.getByRole('button', { name: /bookmark/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bookmark/i })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('redirects guests to /login without calling the API', async () => {
    mockAuth.mockImplementation(() => ({ user: null, isLoading: false }));

    render(<BookmarkButton postId={1} bookmarked={false} />);

    await userEvent.click(screen.getByRole('button', { name: /bookmark/i }));

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(interactions.toggleBookmark).not.toHaveBeenCalled();
  });

  it('rolls back and shows inline error when the toggle fails', async () => {
    vi.mocked(interactions.toggleBookmark).mockResolvedValue(fail('Could not bookmark'));

    render(<BookmarkButton postId={1} bookmarked={false} />);

    await userEvent.click(screen.getByRole('button', { name: /bookmark/i }));

    await waitFor(() => {
      expect(screen.getByText('Could not bookmark')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /bookmark/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables the button while the toggle is pending', async () => {
    let resolveToggle: (value: Awaited<ReturnType<typeof interactions.toggleBookmark>>) => void;
    vi.mocked(interactions.toggleBookmark).mockReturnValue(
      new Promise<Awaited<ReturnType<typeof interactions.toggleBookmark>>>((resolve) => {
        resolveToggle = resolve;
      })
    );

    render(<BookmarkButton postId={1} bookmarked={false} />);

    await userEvent.click(screen.getByRole('button', { name: /bookmark/i }));

    expect(screen.getByRole('button', { name: /bookmark/i })).toBeDisabled();

    resolveToggle!(ok(true));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bookmark/i })).toBeEnabled();
    });
  });
});
