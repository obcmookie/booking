'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type UserRole = 'committee' | 'management' | 'kitchen' | 'finance' | 'admin';

async function routeByRole(userId: string): Promise<string> {
  try {
    const staff = await supabase.rpc('is_staff', { p_user: userId });
    if (staff.data === true) {
      const admin = await supabase.rpc('has_role', { p_user: userId, p_role: 'admin' as UserRole });
      return admin.data === true ? '/admin/pipeline' : '/kitchen/today';
    }
  } catch {
    const roles = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    const r = (roles?.data as { role?: UserRole } | null)?.role ?? null;
    if (r === 'admin') return '/admin/pipeline';
    if (r === 'kitchen') return '/kitchen/today';
  }
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
      {/* ...unchanged inputs/buttons... */}
    </form>
  );
}
