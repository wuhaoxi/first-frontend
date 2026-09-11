import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoteButtons from '@/components/post/VoteButtons';
import * as interactions from '@/lib/api/interactions';
import type { VoteStatsResponse } from '@/types/interactions';

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

function stats(up: number, down: number, userVote: 'UP' | 'DOWN' | null): VoteStatsResponse {
  return { upCount: up, downCount: down, userVote };
}

function ok(data: VoteStatsResponse) {
  return { ok: true as const, data, message: null };
}

function fail(message: string) {
  return { ok: false as const, data: null, message };
}

describe('VoteButtons', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockPush.mockClear();
    mockAuth.mockImplementation(() => ({
      user: { id: 1, name: 'Alice', email: 'a@x.com' },
      isLoading: false,
    }));
  });

  it('renders up/down counts from fetched stats', async () => {
    vi.mocked(interactions.getVoteStats).mockResolvedValue(ok(stats(5, 2, null)));

    render(<VoteButtons postId={1} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vote up/i })).toHaveTextContent('5');
      expect(screen.getByRole('button', { name: /vote down/i })).toHaveTextContent('2');
    });
  });

  it('highlights the button matching the current vote', async () => {
    vi.mocked(interactions.getVoteStats).mockResolvedValue(ok(stats(5, 2, 'UP')));

    render(<VoteButtons postId={1} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vote up/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /vote down/i })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('redirects guests to /login without calling the API', async () => {
    mockAuth.mockImplementation(() => ({ user: null, isLoading: false }));
    vi.mocked(interactions.getVoteStats).mockResolvedValue(ok(stats(5, 2, null)));

    render(<VoteButtons postId={1} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vote up/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /vote up/i }));

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(interactions.castVote).not.toHaveBeenCalled();
  });

  it('optimistically increments when voting with no previous vote', async () => {
    vi.mocked(interactions.getVoteStats).mockResolvedValue(ok(stats(5, 2, null)));
    vi.mocked(interactions.castVote).mockResolvedValue(ok(stats(6, 2, 'UP')));

    render(<VoteButtons postId={1} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vote up/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /vote up/i }));

    expect(screen.getByRole('button', { name: /vote up/i })).toHaveTextContent('6');
    expect(interactions.castVote).toHaveBeenCalledWith(1, 'UP');
  });

  it('cancels the vote when clicking the same button', async () => {
    vi.mocked(interactions.getVoteStats).mockResolvedValue(ok(stats(5, 2, 'UP')));
    vi.mocked(interactions.castVote).mockResolvedValue(ok(stats(4, 2, null)));

    render(<VoteButtons postId={1} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vote up/i })).toHaveAttribute('aria-pressed', 'true');
    });

    await userEvent.click(screen.getByRole('button', { name: /vote up/i }));

    expect(screen.getByRole('button', { name: /vote up/i })).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /vote up/i })).toHaveAttribute('aria-pressed', 'false');
    expect(interactions.castVote).toHaveBeenCalledWith(1, 'UP');
  });

  it('switches counts when voting the other direction', async () => {
    vi.mocked(interactions.getVoteStats).mockResolvedValue(ok(stats(5, 2, 'UP')));
    vi.mocked(interactions.castVote).mockResolvedValue(ok(stats(4, 3, 'DOWN')));

    render(<VoteButtons postId={1} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vote down/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /vote down/i }));

    expect(screen.getByRole('button', { name: /vote up/i })).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /vote down/i })).toHaveTextContent('3');
    expect(interactions.castVote).toHaveBeenCalledWith(1, 'DOWN');
  });

  it('rolls back and shows inline error when the vote fails', async () => {
    vi.mocked(interactions.getVoteStats).mockResolvedValue(ok(stats(5, 2, null)));
    vi.mocked(interactions.castVote).mockResolvedValue(fail('Something went wrong'));

    render(<VoteButtons postId={1} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vote up/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /vote up/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /vote up/i })).toHaveTextContent('5');
  });

  it('disables both buttons while a vote is pending', async () => {
    vi.mocked(interactions.getVoteStats).mockResolvedValue(ok(stats(5, 2, null)));
    let resolveCast: (value: Awaited<ReturnType<typeof interactions.castVote>>) => void;
    vi.mocked(interactions.castVote).mockReturnValue(
      new Promise<Awaited<ReturnType<typeof interactions.castVote>>>((resolve) => {
        resolveCast = resolve;
      })
    );

    render(<VoteButtons postId={1} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vote up/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /vote up/i }));

    expect(screen.getByRole('button', { name: /vote up/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /vote down/i })).toBeDisabled();

    resolveCast!(ok(stats(6, 2, 'UP')));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vote up/i })).toBeEnabled();
    });
  });
});
