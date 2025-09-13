'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const { user } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
    location.href = '/';
  };

  return (
    <div className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="font-semibold">Temple Booking</Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">Hi, {user.email}</span>
              <button onClick={signOut} className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">Sign out</button>
            </>
          ) : (
            <Link href="/login" className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">Sign in</Link>
          )}
        </div>
      </div>
    </div>
  );
}
