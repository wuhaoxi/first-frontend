'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Compass, Menu } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import TravelInfoDialog from '@/components/travel/TravelInfoDialog';
import { cn } from '@/lib/utils';
import type { AuthResponse } from '@/types/auth';

const PRIMARY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/attractions', label: 'Attractions' },
  { href: '/posts', label: 'Posts' },
  { href: '/todos', label: 'Todos' },
] as const;

const MOBILE_PANEL_ID = 'primary-mobile-menu';

const FOCUS_RING =
  'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean): string {
  return cn(
    'px-1 py-0.5 transition-colors',
    FOCUS_RING,
    active
      ? 'font-medium text-foreground underline decoration-primary decoration-2 underline-offset-4'
      : 'text-muted-foreground hover:text-foreground'
  );
}

interface AuthClusterProps {
  user: AuthResponse | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

function AuthCluster({ user, isLoading, logout }: AuthClusterProps) {
  return (
    <div className="flex items-center gap-3">
      {isLoading ? (
        <span className="text-muted-foreground">Loading...</span>
      ) : user ? (
        <>
          <Link
            href="/profile"
            aria-label="Profile"
            className={cn('flex items-center gap-2 hover:text-foreground', FOCUS_RING)}
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
            type="button"
            onClick={() => logout()}
            className={cn('text-primary hover:underline', FOCUS_RING)}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={cn('hover:text-foreground', FOCUS_RING)}>
            Log in
          </Link>
          <Link href="/register" className={cn('hover:text-foreground', FOCUS_RING)}>
            Register
          </Link>
        </>
      )}
    </div>
  );
}

export default function NavBar() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // The panel closes whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const primaryLinks = PRIMARY_LINKS.map(({ href, label }) => {
    const active = isActiveRoute(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={navLinkClass(active)}
      >
        {label}
      </Link>
    );
  });

  return (
    <nav aria-label="Primary" className="mx-auto max-w-7xl px-4">
      <div className="flex h-14 items-center justify-between gap-3 text-sm">
        <Link
          href="/"
          aria-label="WanderChina — home"
          className={cn('flex items-center gap-2 font-semibold tracking-tight', FOCUS_RING)}
        >
          <Compass className="h-6 w-6 text-primary" aria-hidden="true" />
          <span>WanderChina</span>
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-3">{primaryLinks}</div>
          <TravelInfoDialog />
          <AuthCluster user={user} isLoading={isLoading} logout={logout} />
        </div>

        <button
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls={MOBILE_PANEL_ID}
          onClick={() => setMenuOpen((open) => !open)}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent md:hidden',
            FOCUS_RING
          )}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {menuOpen && (
        <div id={MOBILE_PANEL_ID} className="flex flex-col gap-3 border-t py-3 text-sm md:hidden">
          <div className="flex flex-col items-start gap-2">{primaryLinks}</div>
          <TravelInfoDialog />
          <AuthCluster user={user} isLoading={isLoading} logout={logout} />
        </div>
      )}
    </nav>
  );
}
