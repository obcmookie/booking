"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "./supabaseBrowser";

export function useRequireAuth(redirectTo: string = "/admin/login") {
  const router = useRouter();
  const supabase = useMemo(supabaseBrowser, []);
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      if (!data.user) router.replace(redirectTo);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) router.replace(redirectTo);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router, supabase, redirectTo]);

  return { user, loading: user === undefined, supabase };
}
