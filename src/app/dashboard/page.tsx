"use client";
import { useEffect, useState } from "react";
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
  const [session, setSession] = useState<any>(null);
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    (async () => {
      if (!session) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("id, created_at, customer_name, customer_email, customer_phone, event_type, status, event_date, requested_start_date, requested_end_date, space_id")
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
        <nav className="flex gap-3 text-sm">
          <a className="underline" href="/dashboard/calendar">Calendar</a>
          <a className="underline" href="/admin/users">Users</a>
          <a className="underline" href="/">Public</a>
        </nav>
      </header>

      {loading ? <p>Loading…</p> : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Event</th>
                <th className="text-left p-2">Requested Range</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="font-medium">{r.customer_name}</div>
                    <div className="text-slate-500">{r.customer_email}</div>
                    <div className="text-slate-500">{r.customer_phone}</div>
                  </td>
                  <td className="p-2">{r.event_type}</td>
                  <td className="p-2">
                    {r.requested_start_date || r.event_date} → {r.requested_end_date || r.requested_start_date || r.event_date}
                  </td>
                  <td className="p-2">{r.status}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td className="p-4 text-center text-slate-500" colSpan={5}>No bookings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
