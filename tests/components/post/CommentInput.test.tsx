import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentInput from '@/components/post/CommentInput';

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

type AuthState = {
  user: { id: number; name: string; email: string } | null;
  isLoading: boolean;
};

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn<() => AuthState>(() => ({
    user: { id: 1, name: 'Alice', email: 'a@x.com' },
    isLoading: false,
  })),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function okSubmit() {
  return vi.fn<() => Promise<string | null>>().mockResolvedValue(null);
}

describe('CommentInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockImplementation(() => ({
      user: { id: 1, name: 'Alice', email: 'a@x.com' },
      isLoading: false,
    }));
  });

  it('prompts guests to log in instead of showing an input', () => {
    mockAuth.mockImplementation(() => ({ user: null, isLoading: false }));

    render(<CommentInput onSubmit={okSubmit()} replyToName={null} />);

    expect(screen.queryByPlaceholderText(/write a comment/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  it('disables the Post button while the input is blank', () => {
    render(<CommentInput onSubmit={okSubmit()} replyToName={null} />);

    expect(screen.getByRole('button', { name: /post/i })).toBeDisabled();
  });

  it('enables the Post button once text is entered and submits trimmed content', async () => {
    const onSubmit = okSubmit();
    render(<CommentInput onSubmit={onSubmit} replyToName={null} />);

    const input = screen.getByPlaceholderText(/write a comment/i);
    await userEvent.type(input, 'Great post!');

    expect(screen.getByRole('button', { name: /post/i })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: /post/i }));

    expect(onSubmit).toHaveBeenCalledWith('Great post!');
  });

  it('keeps the button disabled for whitespace-only input', async () => {
    render(<CommentInput onSubmit={okSubmit()} replyToName={null} />);

    await userEvent.type(screen.getByPlaceholderText(/write a comment/i), '   ');

    expect(screen.getByRole('button', { name: /post/i })).toBeDisabled();
  });

  // 2500 keystrokes against a controlled textarea take ~4s in jsdom; the default
  // 5s budget is not enough under full-suite load, so this test gets extra time.
  it('shows a live character counter capped at 2000', { timeout: 15000 }, async () => {
    render(<CommentInput onSubmit={okSubmit()} replyToName={null} />);

    const input = screen.getByPlaceholderText(/write a comment/i);
    await userEvent.type(input, 'hello');
    expect(screen.getByText('5/2000')).toBeInTheDocument();

    await userEvent.type(input, 'x'.repeat(2500));
    expect((input as HTMLTextAreaElement).value).toHaveLength(2000);
    expect(screen.getByText('2000/2000')).toBeInTheDocument();
  });

  it('clears the input after a successful submit', async () => {
    const onSubmit = okSubmit();
    render(<CommentInput onSubmit={onSubmit} replyToName={null} />);

    const input = screen.getByPlaceholderText(/write a comment/i);
    await userEvent.type(input, 'First!');
    await userEvent.click(screen.getByRole('button', { name: /post/i }));

    expect(await screen.findByText('0/2000')).toBeInTheDocument();
    expect((input as HTMLTextAreaElement).value).toBe('');
  });

  it('shows the error inline and keeps the text when submit fails', async () => {
    const onSubmit = vi.fn<() => Promise<string | null>>().mockResolvedValue('Something went wrong');
    render(<CommentInput onSubmit={onSubmit} replyToName={null} />);

    const input = screen.getByPlaceholderText(/write a comment/i);
    await userEvent.type(input, 'will fail');
    await userEvent.click(screen.getByRole('button', { name: /post/i }));

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect((input as HTMLTextAreaElement).value).toBe('will fail');
  });

  it('disables the input and button while a submit is pending', async () => {
    let resolveSubmit: (value: string | null) => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    render(<CommentInput onSubmit={onSubmit} replyToName={null} />);

    const input = screen.getByPlaceholderText(/write a comment/i);
    await userEvent.type(input, 'slow comment');
    await userEvent.click(screen.getByRole('button', { name: /post/i }));

    expect(screen.getByRole('button', { name: /post/i })).toBeDisabled();
    expect((input as HTMLTextAreaElement).disabled).toBe(true);

    resolveSubmit!(null);
    expect(await screen.findByText('0/2000')).toBeInTheDocument();
  });

  it('shows reply-mode banner and forwards the cancel action', async () => {
    const onCancelReply = vi.fn();
    render(<CommentInput onSubmit={okSubmit()} replyToName="Alice" onCancelReply={onCancelReply} />);

    expect(
      screen.getAllByText((_, element) => element?.textContent === 'Replying to Alice').length
    ).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel reply' }));
    expect(onCancelReply).toHaveBeenCalled();
  });
});
