import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthContext';
import NavBar from '@/components/NavBar';
import './globals.css';

export const metadata: Metadata = {
  title: 'WanderChina',
  description: 'Travel guides and community',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <NavBar />
          </header>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
