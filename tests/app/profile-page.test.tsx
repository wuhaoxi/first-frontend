import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '@/app/profile/page';
import { updateProfile, uploadAvatar } from '@/lib/api/profile';
import type { AuthResponse } from '@/types/auth';
import type { ProfileResponse } from '@/types/user';

vi.mock('@/lib/api/profile');

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

type AuthState = {
  user: AuthResponse | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
};

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn<() => AuthState>(),
}));

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

const updateProfileMock = vi.mocked(updateProfile);
const uploadAvatarMock = vi.mocked(uploadAvatar);
const mockRefreshUser = vi.fn<() => Promise<void>>();

function makeUser(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    id: 1,
    name: 'TravelCat',
    email: 'alice@example.com',
    avatarUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-08-01T10:00:00',
    updatedAt: '2026-10-04T09:00:00',
    ...overrides,
  };
}

function makeProfileResponse(overrides: Partial<ProfileResponse> = {}): ProfileResponse {
  return {
    id: 1,
    nickname: 'TravelCat',
    email: 'alice@example.com',
    avatarUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-08-01T10:00:00',
    updatedAt: '2026-10-04T09:00:00',
    ...overrides,
  };
}

function setAuth(overrides: Partial<AuthState> = {}) {
  mockAuth.mockReturnValue({
    user: makeUser(),
    isLoading: false,
    refreshUser: mockRefreshUser,
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRefreshUser.mockResolvedValue(undefined);
  setAuth();
});

describe('ProfilePage', () => {
  it('redirects to /login when unauthenticated', () => {
    setAuth({ user: null });

    render(<ProfilePage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('shows a loading skeleton while auth is loading', () => {
    setAuth({ user: null, isLoading: true });

    render(<ProfilePage />);

    expect(screen.queryByLabelText('Nickname')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('prefills nickname and avatar from the current user', () => {
    setAuth({ user: makeUser({ avatarUrl: '/api/uploads/avatars/1/avatar.jpg' }) });

    render(<ProfilePage />);

    expect(screen.getByLabelText('Nickname')).toHaveValue('TravelCat');
    const img = screen.getByRole('img', { name: 'Avatar preview' });
    expect(img.getAttribute('src') ?? '').toContain('avatar.jpg');
  });

  it('shows an initial placeholder when the user has no avatar', () => {
    setAuth({ user: makeUser({ avatarUrl: null }) });

    render(<ProfilePage />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('saves the nickname, shows success feedback and refreshes the user', async () => {
    const user = userEvent.setup();
    updateProfileMock.mockResolvedValue({
      ok: true,
      data: makeProfileResponse({ nickname: 'Explorer' }),
      message: null,
    });

    render(<ProfilePage />);

    const input = screen.getByLabelText('Nickname');
    await user.clear(input);
    await user.type(input, 'Explorer');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateProfileMock).toHaveBeenCalledWith({ nickname: 'Explorer' });
    expect(await screen.findByText('Profile saved')).toBeInTheDocument();
    expect(mockRefreshUser).toHaveBeenCalled();
  });

  it('shows the backend error message when saving fails', async () => {
    const user = userEvent.setup();
    updateProfileMock.mockResolvedValue({
      ok: false,
      data: null,
      message: 'nickname must not exceed 100 characters',
    });

    render(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('nickname must not exceed 100 characters')
    ).toBeInTheDocument();
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });

  it('uploads the avatar, updates the preview and refreshes the user', async () => {
    const user = userEvent.setup();
    uploadAvatarMock.mockResolvedValue({
      ok: true,
      data: { avatarUrl: '/api/uploads/avatars/1/avatar.png' },
      message: null,
    });

    render(<ProfilePage />);

    const file = new File(['data'], 'avatar.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Avatar'), file);

    expect(uploadAvatarMock).toHaveBeenCalledWith(file);
    const img = await screen.findByRole('img', { name: 'Avatar preview' });
    expect(img.getAttribute('src') ?? '').toContain('avatar.png');
    expect(await screen.findByText('Avatar updated')).toBeInTheDocument();
    expect(mockRefreshUser).toHaveBeenCalled();
  });

  it('shows the backend error message when avatar upload fails', async () => {
    const user = userEvent.setup();
    uploadAvatarMock.mockResolvedValue({
      ok: false,
      data: null,
      message: 'Image must not exceed 5MB',
    });

    render(<ProfilePage />);

    const file = new File(['data'], 'large.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('Avatar'), file);

    expect(await screen.findByText('Image must not exceed 5MB')).toBeInTheDocument();
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });
});
