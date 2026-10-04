'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import { updateProfile, uploadAvatar } from '@/lib/api/profile';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  const [nickname, setNickname] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Seed the form from the current auth user (also re-seeds after refreshUser).
  useEffect(() => {
    if (user) {
      setNickname(user.name);
      setAvatarPreview(user.avatarUrl);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    setSaving(true);

    const result = await updateProfile({ nickname });
    setSaving(false);

    if (!result.ok || !result.data) {
      setError(result.message ?? 'Failed to save profile');
      return;
    }

    setNickname(result.data.nickname);
    setFeedback('Profile saved');
    refreshUser().catch(() => {});
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setError(null);
    setFeedback(null);
    setUploading(true);

    const result = await uploadAvatar(file);
    setUploading(false);
    e.target.value = '';

    if (!result.ok || !result.data) {
      setError(result.message ?? 'Failed to upload avatar');
      return;
    }

    setAvatarPreview(result.data.avatarUrl);
    setFeedback('Avatar updated');
    refreshUser().catch(() => {});
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded bg-muted" />
          <div className="h-24 w-24 rounded-full bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {feedback && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      )}

      <section className="mb-8 flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="Avatar preview"
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <label htmlFor="avatar" className="mb-1 block text-sm font-medium">
            Avatar
          </label>
          <input
            id="avatar"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleAvatarChange}
            disabled={uploading}
            className="block text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">JPEG or PNG, up to 5MB.</p>
          {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading...</p>}
        </div>
      </section>

      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div>
          <label htmlFor="nickname" className="mb-1 block text-sm font-medium">
            Nickname
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            maxLength={100}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
