import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserList from '../../src/components/UserList';
import * as api from '../../src/api/users';

vi.mock('../../src/api/users');

const mockUsers = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

describe('UserList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders user rows when API returns data', async () => {
    vi.mocked(api.getUsers).mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('renders empty state when no users', async () => {
    vi.mocked(api.getUsers).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No users found/)).toBeInTheDocument();
    });
  });

  it('displays error when API fails', async () => {
    vi.mocked(api.getUsers).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
