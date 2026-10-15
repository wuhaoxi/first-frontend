import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/components/AuthContext';
import { getAttractions } from '@/lib/api/attractions';
import { getCurrentWeather, getForecast } from '@/lib/api/weather';
import { getLatestRates } from '@/lib/api/exchangeRates';
import type { AuthResponse } from '@/types/auth';

vi.mock('@/components/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// The dialog mounts its sections only when opened; hold every request
// unresolved so these tests never touch the network.
vi.mock('@/lib/api/attractions');
vi.mock('@/lib/api/weather');
vi.mock('@/lib/api/exchangeRates');

const useAuthMock = vi.mocked(useAuth);
const usePathnameMock = vi.mocked(usePathname);

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
  usePathnameMock.mockReturnValue('/');
  vi.mocked(getAttractions).mockReturnValue(never());
  vi.mocked(getCurrentWeather).mockReturnValue(never());
  vi.mocked(getForecast).mockReturnValue(never());
  vi.mocked(getLatestRates).mockReturnValue(never());
});

describe('NavBar', () => {
  // --- Brand ---

  it('renders the brand link to / with the Compass mark and accessible name', () => {
    render(<NavBar />);

    const brand = screen.getByRole('link', { name: 'WanderChina — home' });
    expect(brand).toHaveAttribute('href', '/');
    expect(brand).toHaveTextContent('WanderChina');
    expect(brand.querySelector('svg')).not.toBeNull();
  });

  // --- Primary links and active state ---

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

  it('marks the current route with aria-current and leaves other links unset', () => {
    usePathnameMock.mockReturnValue('/attractions');
    render(<NavBar />);

    expect(screen.getByRole('link', { name: 'Attractions' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Posts' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Todos' })).not.toHaveAttribute('aria-current');
  });

  it('keeps Home inactive on nested routes and matches other links by prefix', () => {
    usePathnameMock.mockReturnValue('/posts/123');
    render(<NavBar />);

    expect(screen.getByRole('link', { name: 'Posts' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('activates Home only on the exact root path', () => {
    usePathnameMock.mockReturnValue('/');
    render(<NavBar />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  // --- Mobile menu ---

  it('toggles the mobile menu and exposes a labelled panel with links, travel entry and auth', async () => {
    render(<NavBar />);

    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'primary-mobile-menu');
    expect(document.getElementById('primary-mobile-menu')).toBeNull();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById('primary-mobile-menu');
    expect(panel).not.toBeNull();
    const menu = within(panel as HTMLElement);
    expect(menu.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(menu.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
    expect(menu.getByRole('button', { name: 'Weather & Rates' })).toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('primary-mobile-menu')).toBeNull();
  });

  it('closes the mobile menu on Escape', async () => {
    render(<NavBar />);

    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('primary-mobile-menu')).toBeNull();
  });

  // --- Auth cluster ---

  it('shows Log in and Register links when signed out', () => {
    render(<NavBar />);

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  });

  it('shows a muted placeholder while the auth state loads', () => {
    setAuth({ user: null, isLoading: true });

    render(<NavBar />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
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

  it('calls logout when the Logout button is clicked', async () => {
    const logout = vi.fn();
    setAuth({ user: makeUser(), logout });

    render(<NavBar />);

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  // --- Travel info entry ---

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
