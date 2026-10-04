import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/components/AuthContext';
import type { AuthResponse } from '@/types/auth';

vi.mock('@/components/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

function makeUser(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    avatarUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-08-01T10:00:00',
    updatedAt: '2026-10-04T09:00:00',
    ...overrides,
  };
}

function setAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  useAuthMock.mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAuth>);
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth();
});

describe('NavBar', () => {
  it('renders an Attractions link to /attractions', () => {
    render(<NavBar />);

    const link = screen.getByRole('link', { name: 'Attractions' });
    expect(link).toHaveAttribute('href', '/attractions');
  });

  it('places Attractions between Home and Posts in DOM order', () => {
    render(<NavBar />);

    const labels = screen
      .getAllByRole('link')
      .map((link) => link.textContent)
      .filter((text): text is string => ['Home', 'Attractions', 'Posts', 'Todos'].includes(text ?? ''));

    expect(labels).toEqual(['Home', 'Attractions', 'Posts', 'Todos']);
  });

  it('links to /profile with the user avatar when signed in', () => {
    setAuth({ user: makeUser({ avatarUrl: '/api/uploads/avatars/1/avatar.jpg' }) });

    render(<NavBar />);

    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link).toHaveAttribute('href', '/profile');
    const img = within(link).getByRole('img');
    expect(img.getAttribute('src') ?? '').toContain('avatar.jpg');
  });

  it('shows an initial placeholder inside the profile link when the user has no avatar', () => {
    setAuth({ user: makeUser({ avatarUrl: null }) });

    render(<NavBar />);

    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link).toHaveAttribute('href', '/profile');
    expect(within(link).queryByRole('img')).not.toBeInTheDocument();
    expect(within(link).getByText('A')).toBeInTheDocument();
    expect(within(link).getByText('Alice')).toBeInTheDocument();
  });
});
