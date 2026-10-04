import type { UserStatus } from '@/types/auth';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface UpdateProfileRequest {
  nickname: string;
}

export interface ProfileResponse {
  id: number;
  nickname: string;
  email: string;
  avatarUrl: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}
