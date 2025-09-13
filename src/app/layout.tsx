import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './providers';
import Header from '@/components/Header';

export const metadata: Metadata = { title: 'Temple Booking' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <AuthProvider>
          <Header />
          <main className="mx-auto max-w-6xl p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
