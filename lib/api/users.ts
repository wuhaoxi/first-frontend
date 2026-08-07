import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';

const BASE_URL = '/api/users';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`${response.status}: ${body.message || response.statusText}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export async function getUsers(): Promise<User[]> {
  const response = await fetch(BASE_URL, { credentials: 'include' });
  return handleResponse<User[]>(response);
}

export async function getUserById(id: number): Promise<User> {
  const response = await fetch(`${BASE_URL}/${id}`, { credentials: 'include' });
  return handleResponse<User>(response);
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<User>(response);
}

export async function updateUser(id: number, data: UpdateUserRequest): Promise<User> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<User>(response);
}

export async function deleteUser(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse<void>(response);
}
