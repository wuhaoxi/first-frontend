'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';

export default function NavBar() {
  const { user, isLoading, logout } = useAuth();

  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link href="/" className="hover:underline">Home</Link>
      <span className="text-muted-foreground">|</span>
      <Link href="/attractions" className="hover:underline">Attractions</Link>
      <span className="text-muted-foreground">|</span>
      <Link href="/posts" className="hover:underline">Posts</Link>
      <span className="text-muted-foreground">|</span>
      <Link href="/todos" className="hover:underline">Todos</Link>

      <span className="text-muted-foreground">|</span>

      {isLoading ? (
        <span className="text-muted-foreground">Loading...</span>
      ) : user ? (
        <>
          <Link
            href="/profile"
            aria-label="Profile"
            className="flex items-center gap-2 hover:underline"
          >
            <span className="relative block h-7 w-7 overflow-hidden rounded-full bg-muted">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`${user.name}'s avatar`}
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="font-medium">{user.name}</span>
          </Link>
          <button
            onClick={() => logout()}
            className="text-primary hover:underline"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="hover:underline">Log In</Link>
          <Link href="/register" className="hover:underline">Register</Link>
        </>
      )}
    </nav>
  );
}
