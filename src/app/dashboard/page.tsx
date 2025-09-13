"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type Booking = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_type: string;
  status: string;
  event_date: string | null;
  requested_start_date: string | null;
  requested_end_date: string | null;
  space_id: string | null;
};

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prime session once
    void supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    // Subscribe for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!session) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, created_at, customer_name, customer_email, customer_phone, event_type, status, event_date, requested_start_date, requested_end_date, space_id",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data as Booking[]) ?? []);
      }
      setLoading(false);
    };
    void run();
  }, [session]);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">All Bookings</h1>
        <nav className="flex gap-3 text-sm">
          <Link className="underline" href="/dashboard/calendar">
            Calendar
          </Link>
          <Link className="underline" href="/admin/users">
            Users
          </Link>
          <Link className="underline" href="/">
            Public
          </Link>
        </nav>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Event</th>
                <th className="p-2 text-left">Requested Range</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="font-medium">{r.customer_name}</div>
                    <div className="text-slate-500">{r.customer_email}</div>
                    <div className="text-slate-500">{r.customer_phone}</div>
                  </td>
                  <td className="p-2">{r.event_type}</td>
                  <td className="p-2">
                    {(r.requested_start_date ?? r.event_date) ?? "-"} →{" "}
                    {(r.requested_end_date ?? r.requested_start_date ?? r.event_date) ?? "-"}
                  </td>
                  <td className="p-2">{r.status}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={5}>
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
