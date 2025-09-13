"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/modules/auth/useRequireAuth";
import { supabaseBrowser } from "@/modules/auth/supabaseBrowser";
import { useMyRoles } from "@/modules/auth/useMyRoles";

type BookingRow = {
  id: string;
  created_at: string;
  customer_name: string;
  event_date: string | null;
  requested_start_date: string | null;
  requested_end_date: string | null;
  status: string;
};

export default function AdminHome() {
  const router = useRouter();
  const { user, loading } = useRequireAuth("/admin/login"); // your existing guard
  const supabase = useMemo(supabaseBrowser, []);
  const roles = useMyRoles(user);

  const [rows, setRows] = useState<BookingRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Redirect kitchen-only users to /admin/kitchen exactly once
  useEffect(() => {
    if (!user || roles === undefined) return;
    const isAdmin = roles.includes("admin");
    const isKitchen = roles.includes("kitchen");
    if (isKitchen && !isAdmin) {
      router.replace("/admin/kitchen");
    }
  }, [user, roles, router]);

  // Load recent bookings for admins
  useEffect(() => {
    if (!user || roles === undefined) return;
    const isAdmin = roles.includes("admin");
    if (!isAdmin) return;

    let cancelled = false;
    (async () => {
      setBusy(true);
      setErr(null);
      const { data, error } = await supabase
        .from("bookings")
        .select("id, created_at, customer_name, event_date, requested_start_date, requested_end_date, status")
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;
      setBusy(false);
      if (error) setErr(error.message);
      else setRows((data ?? []) as BookingRow[]);
    })();

    return () => { cancelled = true; };
  }, [user, roles, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (loading || roles === undefined) return <div className="p-6">Loading…</div>;
  if (!user) return null;

  const isAdmin = roles.includes("admin");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Inbox</h1>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link className="px-3 py-2 rounded-md bg-gray-100" href="/admin/users">
              Manage Users
            </Link>
          )}
          <button className="px-3 py-2 rounded-md bg-gray-100" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      {err && <p className="text-red-600">{err}</p>}

      <div className="rounded-xl overflow-hidden border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Requested Window / Scheduled</th>
              <th className="p-3">Status</th>
              <th className="p-3">View</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">{r.customer_name}</td>
                <td className="p-3">
                  {r.event_date
                    ? <>Scheduled: {r.event_date}</>
                    : (r.requested_start_date && r.requested_end_date
                        ? <>{r.requested_start_date} → {r.requested_end_date}</>
                        : "—")}
                </td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  <a className="text-blue-600 hover:underline" href={`/admin/bookings/${r.id}`}>
                    Open
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !busy && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={5}>
                  No recent inquiries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
