export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  message: string | null;
}

/**
 * Shared API client — the standard for new API modules.
 *
 * Never throws for HTTP errors or network failures; always returns an
 * ApiResponse so callers can branch on `ok` instead of try/catch.
 * Always sends `credentials: 'include'` (httpOnly cookie auth).
 */
export async function authFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(input, { ...init, headers, credentials: 'include' });
  } catch {
    return { ok: false, data: null, message: 'Network error' };
  }

  if (response.status === 204) {
    return { ok: true, data: null, message: null };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    return { ok: false, data: null, message: body.message || response.statusText };
  }

  const data = await response.json();
  return { ok: true, data: data as T, message: null };
}
