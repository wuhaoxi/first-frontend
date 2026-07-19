import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UserForm from '../../src/components/UserForm';
import * as api from '../../src/api/users';

vi.mock('../../src/api/users');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  };
});

describe('UserForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
  });

  it('renders form fields', () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('submits create request with form data', async () => {
    const user = userEvent.setup();
    vi.mocked(api.createUser).mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@example.com' });

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText('Name'), 'Alice');
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays error when API fails', async () => {
    const user = userEvent.setup();
    vi.mocked(api.createUser).mockRejectedValue(new Error('409: Email already exists'));

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText('Name'), 'Bob');
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('409: Email already exists')).toBeInTheDocument();
    });
  });
});
