import { authFetch, ApiResponse } from '@/lib/api/client';
import type {
  UpdateProfileRequest,
  ProfileResponse,
  AvatarUploadResponse,
} from '@/types/user';

export function updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<ProfileResponse>> {
  return authFetch<ProfileResponse>('/api/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function uploadAvatar(file: File): Promise<ApiResponse<AvatarUploadResponse>> {
  const formData = new FormData();
  formData.append('file', file);
  return authFetch<AvatarUploadResponse>('/api/users/me/avatar', {
    method: 'POST',
    body: formData,
  });
}
