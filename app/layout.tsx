import type { Metadata } from 'next';
import Link from 'next/link';
import '../index.css';
import '../App.css';

export const metadata: Metadata = {
  title: 'User Management',
  description: 'User and Todo management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <header>
            <h1>My App</h1>
          </header>
          <nav>
            <Link href="/">Users</Link>
            <span className="nav-sep"> | </span>
            <Link href="/todos">Todos</Link>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
