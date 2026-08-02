import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '@/lib/api/users';

describe('users API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getUsers returns user list', async () => {
    const mockUsers = [{ id: 1, name: 'Alice', email: 'alice@example.com' }];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockUsers),
    });

    const result = await getUsers();
    expect(result).toEqual(mockUsers);
    expect(fetch).toHaveBeenCalledWith('/api/users');
  });

  it('getUserById returns a single user', async () => {
    const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockUser),
    });

    const result = await getUserById(1);
    expect(result).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledWith('/api/users/1');
  });

  it('createUser sends POST with JSON body', async () => {
    const request = { name: 'Alice', email: 'alice@example.com' };
    const created = { id: 1, ...request };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(created),
    });

    const result = await createUser(request);
    expect(result).toEqual(created);
    expect(fetch).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  });

  it('updateUser sends PUT request', async () => {
    const request = { name: 'Alice Updated' };
    const updated = { id: 1, name: 'Alice Updated', email: 'alice@example.com' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updated),
    });

    const result = await updateUser(1, request);
    expect(result).toEqual(updated);
    expect(fetch).toHaveBeenCalledWith('/api/users/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  });

  it('deleteUser sends DELETE request', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(undefined),
    });

    await deleteUser(1);
    expect(fetch).toHaveBeenCalledWith('/api/users/1', { method: 'DELETE' });
  });

  it('throws error on non-OK response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ message: 'User not found with id: 999' }),
    });

    await expect(getUserById(999)).rejects.toThrow('404: User not found with id: 999');
  });
});
