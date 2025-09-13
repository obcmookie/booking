"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "./supabaseBrowser";

export function useMyRoles(user: User | null | undefined) {
  const [roles, setRoles] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!user) { if (mounted) setRoles([]); return; }
      const sb = supabaseBrowser();
      const { data, error } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (!mounted) return;
      if (error) { setRoles([]); return; }
      setRoles((data ?? []).map((r: { role: string }) => r.role));
    };
    run();
    return () => { mounted = false; };
  }, [user]);

  return roles;
}
