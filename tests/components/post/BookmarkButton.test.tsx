import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Heart } from 'lucide-react';
import BookmarkButton from '@/components/post/BookmarkButton';
import type { ApiResponse } from '@/lib/api/client';

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

function resolved(active: boolean): ApiResponse<boolean> {
  return { ok: true, data: active, message: null };
}

function rejected(message: string): ApiResponse<boolean> {
  return { ok: false, data: null, message };
}

describe('BookmarkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockImplementation(() => ({
      user: { id: 1, name: 'Alice', email: 'a@x.com' },
      isLoading: false,
    }));
  });

  it('renders the active state with the filled icon', () => {
    const { container } = render(<BookmarkButton active={true} toggle={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Remove bookmark');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('.lucide-bookmark-check')).toBeInTheDocument();
  });

  it('renders the inactive state with the outline icon', () => {
    const { container } = render(<BookmarkButton active={false} toggle={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Bookmark');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('.lucide-bookmark')).toBeInTheDocument();
  });

  it('renders the inactive state when active is unknown (guest)', () => {
    render(<BookmarkButton active={null} toggle={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles optimistically, reconciles with the resolved value and notifies onChanged', async () => {
    const toggle = vi.fn().mockResolvedValue(resolved(true));
    const onChanged = vi.fn();

    render(<BookmarkButton active={false} toggle={toggle} onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button'));

    expect(toggle).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
      expect(onChanged).toHaveBeenCalledWith(true);
    });
  });

  it('flips back off when toggling an active bookmark', async () => {
    const toggle = vi.fn().mockResolvedValue(resolved(false));
    const onChanged = vi.fn();

    render(<BookmarkButton active={true} toggle={toggle} onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
      expect(onChanged).toHaveBeenCalledWith(false);
    });
  });

  it('redirects guests to /login without calling toggle', async () => {
    mockAuth.mockImplementation(() => ({ user: null, isLoading: false }));
    const toggle = vi.fn();

    render(<BookmarkButton active={false} toggle={toggle} />);

    await userEvent.click(screen.getByRole('button'));

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(toggle).not.toHaveBeenCalled();
  });

  it('rolls back and shows an inline error when the toggle fails', async () => {
    const toggle = vi.fn().mockResolvedValue(rejected('Could not bookmark'));
    const onChanged = vi.fn();

    render(<BookmarkButton active={false} toggle={toggle} onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button'));

    expect(await screen.findByText('Could not bookmark')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('disables the button while the toggle is pending', async () => {
    let resolveToggle!: (value: ApiResponse<boolean>) => void;
    const toggle = vi.fn(
      () =>
        new Promise<ApiResponse<boolean>>((resolve) => {
          resolveToggle = resolve;
        })
    );

    render(<BookmarkButton active={false} toggle={toggle} />);

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();

    resolveToggle(resolved(true));
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled();
    });
  });

  it('honors custom labels for both states', async () => {
    const toggle = vi.fn().mockResolvedValue(resolved(true));

    render(
      <BookmarkButton
        active={false}
        toggle={toggle}
        labels={{ add: 'Add to favorites', remove: 'Remove from favorites' }}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove from favorites' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });

  it('renders custom icons when provided', () => {
    const { container, unmount } = render(
      <BookmarkButton active={false} toggle={vi.fn()} icon={Heart} activeIcon={Heart} />
    );

    expect(container.querySelector('.lucide-heart')).toBeInTheDocument();
    expect(container.querySelector('.lucide-bookmark')).not.toBeInTheDocument();

    unmount();

    const activeRender = render(
      <BookmarkButton active={true} toggle={vi.fn()} icon={Heart} activeIcon={Heart} />
    );

    expect(activeRender.container.querySelector('.lucide-heart')).toBeInTheDocument();
  });
});
