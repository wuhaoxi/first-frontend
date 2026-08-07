import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ChangePasswordRequest,
  VerifyEmailRequest,
} from '@/types/auth';

const BASE_URL = '/api/auth';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`${response.status}: ${body.message || response.statusText}`);
  }
  return response.json();
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<AuthResponse>(response);
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<AuthResponse>(response);
}

export async function refresh(): Promise<{ message: string }> {
  const response = await fetch(`${BASE_URL}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse<{ message: string }>(response);
}

export async function verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
  const response = await fetch(`${BASE_URL}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string }>(response);
}

export async function logout(): Promise<{ message: string }> {
  const response = await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse<{ message: string }>(response);
}

export async function getMe(): Promise<AuthResponse | null> {
  const response = await fetch(`${BASE_URL}/me`, {
    credentials: 'include',
  });
  if (response.status === 401) {
    return null;
  }
  return handleResponse<AuthResponse>(response);
}

export async function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  const response = await fetch(`${BASE_URL}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string }>(response);
}
