// src/app/layout.tsx
import './globals.css';
import { AuthProvider, useAuth } from './providers';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export const metadata = { title: 'Temple Booking' };

function Header() {
  // client boundary wrapper
  return (
    <div className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="font-semibold">Temple Booking</Link>
        <UserButtons />
      </div>
    </div>
  );
}

function UserButtons() {
  // small client island
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
    location.href = '/';
  };

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <span className="text-sm text-gray-600 hidden sm:inline">Hi, {user.email}</span>
          <button onClick={signOut} className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">Sign out</button>
        </>
      ) : (
        <Link href="/login" className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">Sign in</Link>
      )}
    </div>
  );
}

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
