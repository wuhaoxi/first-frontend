import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserForm from '@/components/UserForm';
import * as api from '@/lib/api/users';

vi.mock('@/lib/api/users');

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('UserForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
  });

  it('renders form fields', () => {
    render(<UserForm />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('submits create request with form data', async () => {
    const user = userEvent.setup();
    vi.mocked(api.createUser).mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@example.com' });

    render(<UserForm />);

    await user.type(screen.getByLabelText('Name'), 'Alice');
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com' });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error when API fails', async () => {
    const user = userEvent.setup();
    vi.mocked(api.createUser).mockRejectedValue(new Error('409: Email already exists'));

    render(<UserForm />);

    await user.type(screen.getByLabelText('Name'), 'Bob');
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('409: Email already exists')).toBeInTheDocument();
    });
  });
});
