"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";

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
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!session) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, created_at, customer_name, customer_email, customer_phone, event_type, status, event_date, requested_start_date, requested_end_date, space_id"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) console.error(error);
      setRows((data as Booking[]) || []);
      setLoading(false);
    })();
  }, [session]);

  return (
    <main className="max-w-6xl mx-auto p-4">
      <header className="flex items-center justify-between mb-3">
        <h1 className="font-semibold text-xl">All Bookings</h1>
        <nav className="flex gap-3 text-sm flex-wrap">
          {/* existing */}
          <Link className="underline" href="/dashboard/calendar">
            Calendar
          </Link>
          <Link className="underline" href="/admin/users">
            Users
          </Link>
          <Link className="underline" href="/">
            Public
          </Link>

          {/* admin shortcuts */}
          <span className="opacity-50">|</span>
          <Link className="underline" href="/admin/bookings">
            Bookings
          </Link>
          <Link className="underline" href="/admin/services">
            Services
          </Link>
          <Link className="underline" href="/admin/menu">
            Food Menu
          </Link>
          <Link className="underline" href="/admin/settings">
            Settings
          </Link>
        </nav>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Event</th>
                <th className="text-left p-2">Requested Range</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const start = r.requested_start_date || r.event_date || "-";
                const end = r.requested_end_date || r.requested_start_date || r.event_date || "-";
                const dateRange = `${start} → ${end}`;
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-2">
                      <div className="font-medium">{r.customer_name}</div>
                      <div className="text-slate-500">{r.customer_email}</div>
                      <div className="text-slate-500">{r.customer_phone}</div>
                    </td>
                    <td className="p-2">
                      <Link className="underline" href={`/admin/bookings/${r.id}/intake`}>
                        {r.event_type}
                      </Link>
                    </td>
                    <td className="p-2">{dateRange}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Link
                          className="border rounded px-2 py-1"
                          href={`/admin/bookings/${r.id}/intake`}
                        >
                          Intake
                        </Link>
                        <Link
                          className="border rounded px-2 py-1"
                          href={`/admin/bookings/${r.id}/menu`}
                        >
                          Menu
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={6}>
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
