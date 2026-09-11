import { describe, it, expect, vi, afterEach } from 'vitest';
import { authFetch } from '@/lib/api/client';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('authFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns ok with parsed data on 2xx JSON responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { id: 1 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await authFetch<{ id: number }>('/api/posts/1');

    expect(result).toEqual({ ok: true, data: { id: 1 }, message: null });
  });

  it('always sends credentials include', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    await authFetch('/api/posts/1');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/posts/1',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('returns ok with null data on 204 No Content', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await authFetch('/api/comments/5');

    expect(result).toEqual({ ok: true, data: null, message: null });
  });

  it('returns the backend error message on non-2xx responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(400, { message: 'content must not be blank' })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await authFetch('/api/posts/1/comments');

    expect(result).toEqual({ ok: false, data: null, message: 'content must not be blank' });
  });

  it('falls back to statusText when the error body is not JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await authFetch('/api/posts/1');

    expect(result).toEqual({ ok: false, data: null, message: 'Bad Gateway' });
  });

  it('returns Network error when fetch itself rejects', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await authFetch('/api/posts/1');

    expect(result).toEqual({ ok: false, data: null, message: 'Network error' });
  });

  it('sets Content-Type application/json for JSON bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    await authFetch('/api/posts/1/votes', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'UP' }),
    });

    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(init.method).toBe('POST');
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});
