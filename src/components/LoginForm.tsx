// src/components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

async function routeByRole(userId: string): Promise<string> {
  // Prefer SECURITY DEFINER RPCs first
  try {
    const staff = await supabase.rpc('is_staff', { p_user: userId });
    if (staff.data === true) {
      // If staff, check admin to route finer
      const admin = await supabase.rpc('has_role', { p_user: userId, p_role: 'admin' as any });
      return admin.data === true ? '/admin/pipeline' : '/kitchen/today';
    }
  } catch {
    // Fallback: try a direct role read (may be blocked by RLS for non-staff)
    const roles = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    const r = roles?.data?.role ?? null;
    if (r === 'admin') return '/admin/pipeline';
    if (r === 'kitchen') return '/kitchen/today';
  }
  // Default if no role set yet
  return '/';
}

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    const uid = data.user?.id;
    if (uid) {
      const dest = await routeByRole(uid);
      onSuccess?.();
      router.replace(dest);
    } else {
      router.replace('/');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          required
          value={pw}
          onChange={e => setPw(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          placeholder="••••••••"
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-black text-white py-2 font-medium disabled:opacity-60"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
