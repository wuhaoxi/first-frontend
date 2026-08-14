'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';

export default function NavBar() {
  const { user, isLoading, logout } = useAuth();

  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link href="/" className="hover:underline">Home</Link>
      <span className="text-muted-foreground">|</span>
      <Link href="/posts" className="hover:underline">Posts</Link>
      <span className="text-muted-foreground">|</span>
      <Link href="/todos" className="hover:underline">Todos</Link>

      <span className="text-muted-foreground">|</span>

      {isLoading ? (
        <span className="text-muted-foreground">Loading...</span>
      ) : user ? (
        <>
          <span className="font-medium">{user.name}</span>
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
