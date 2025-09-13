// src/components/RoleGate.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export function StaffGate({ children }: { children: React.ReactNode }) {
  return <RoleGate check="staff">{children}</RoleGate>;
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  return <RoleGate check="admin">{children}</RoleGate>;
}

function RoleGate({ children, check }: { children: React.ReactNode; check: 'admin' | 'staff' }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const go = async () => {
      if (loading) return;
      if (!user) {
        setAllowed(false);
        router.replace('/login');
        return;
      }
      try {
        if (check === 'admin') {
          const res = await supabase.rpc('has_role', { p_user: user.id, p_role: 'admin' as any });
          setAllowed(res.data === true);
          if (res.data !== true) router.replace('/');
        } else {
          const res = await supabase.rpc('is_staff', { p_user: user.id });
          setAllowed(res.data === true);
          if (res.data !== true) router.replace('/');
        }
      } catch {
        setAllowed(false);
        router.replace('/');
      }
    };
    go();
  }, [user, loading, check, router]);

  if (loading || allowed === null) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-pulse text-sm text-gray-600">Checking access…</div>
      </div>
    );
  }

  return allowed ? <>{children}</> : null;
}
