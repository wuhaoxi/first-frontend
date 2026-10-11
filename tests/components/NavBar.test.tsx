import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/components/AuthContext';
import { getAttractions } from '@/lib/api/attractions';
import { getCurrentWeather, getForecast } from '@/lib/api/weather';
import { getLatestRates } from '@/lib/api/exchangeRates';
import type { AuthResponse } from '@/types/auth';

vi.mock('@/components/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// The dialog mounts its sections only when opened; hold every request
// unresolved so these tests never touch the network.
vi.mock('@/lib/api/attractions');
vi.mock('@/lib/api/weather');
vi.mock('@/lib/api/exchangeRates');

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

function never<T>(): Promise<T> {
  return new Promise<T>(() => {});
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth();
  vi.mocked(getAttractions).mockReturnValue(never());
  vi.mocked(getCurrentWeather).mockReturnValue(never());
  vi.mocked(getForecast).mockReturnValue(never());
  vi.mocked(getLatestRates).mockReturnValue(never());
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

  it('renders the Weather & Rates trigger after the existing links and never disables it', () => {
    render(<NavBar />);

    const trigger = screen.getByRole('button', { name: 'Weather & Rates' });
    expect(trigger).toBeEnabled();

    const todos = screen.getByRole('link', { name: 'Todos' });
    expect(todos.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('the trigger opens the dialog without navigating', async () => {
    render(<NavBar />);

    await userEvent.click(screen.getByRole('button', { name: 'Weather & Rates' }));

    expect(await screen.findByRole('heading', { name: 'Weather & Rates' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });
});
