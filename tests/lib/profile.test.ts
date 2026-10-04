import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfile, uploadAvatar } from '@/lib/api/profile';
import { authFetch, ApiResponse } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  authFetch: vi.fn(),
}));

const authFetchMock = vi.mocked(authFetch);

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, message: null };
}

const profile = {
  id: 1,
  nickname: 'TravelCat',
  email: 'alice@example.com',
  avatarUrl: null,
  status: 'ACTIVE' as const,
  createdAt: '2026-08-01T10:00:00',
  updatedAt: '2026-10-04T09:00:00',
};

describe('profile API', () => {
  beforeEach(() => {
    authFetchMock.mockReset();
  });

  it('updateProfile PUTs the nickname to /api/users/me/profile', async () => {
    authFetchMock.mockResolvedValue(ok(profile));

    const result = await updateProfile({ nickname: 'TravelCat' });

    expect(authFetchMock).toHaveBeenCalledWith('/api/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify({ nickname: 'TravelCat' }),
    });
    expect(result.ok).toBe(true);
    expect(result.data?.nickname).toBe('TravelCat');
  });

  it('updateProfile propagates failures', async () => {
    authFetchMock.mockResolvedValue({
      ok: false,
      data: null,
      message: 'nickname must not be blank',
    });

    const result = await updateProfile({ nickname: '' });

    expect(result).toEqual({ ok: false, data: null, message: 'nickname must not be blank' });
  });

  it('uploadAvatar POSTs the file as multipart FormData to /api/users/me/avatar', async () => {
    authFetchMock.mockResolvedValue(ok({ avatarUrl: '/api/uploads/avatars/1/avatar.jpg' }));
    const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });

    const result = await uploadAvatar(file);

    const [url, init] = authFetchMock.mock.calls[0];
    expect(url).toBe('/api/users/me/avatar');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get('file')).toBe(file);
    expect(result.data?.avatarUrl).toBe('/api/uploads/avatars/1/avatar.jpg');
  });

  it('uploadAvatar propagates failures', async () => {
    authFetchMock.mockResolvedValue({
      ok: false,
      data: null,
      message: 'Only JPEG and PNG images are allowed',
    });
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

    const result = await uploadAvatar(file);

    expect(result).toEqual({
      ok: false,
      data: null,
      message: 'Only JPEG and PNG images are allowed',
    });
  });
});
