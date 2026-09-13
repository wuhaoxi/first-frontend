import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NavBar from '@/components/NavBar';

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false, logout: vi.fn() }),
}));

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
});
