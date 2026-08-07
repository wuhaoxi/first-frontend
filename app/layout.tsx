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
          <div className="app">
            <header>
              <h1>My App</h1>
            </header>
            <NavBar />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
