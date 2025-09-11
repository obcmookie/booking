"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/modules/auth/useRequireAuth";
import { useMyRoles } from "@/modules/auth/useMyRoles";

type Row = {
  id: string;
  customer_name: string;
  event_date: string;
  block_type: string;
  start_at: string | null;
  end_at: string | null;
  notes_public: string | null;
  status: string;
  space_id: string | null;
};

function fmtTime(ts: string | null) {
  if (!ts) return "—";
  try { return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } catch { return "—"; }
}

export default function KitchenPage() {
  const { user, loading, supabase } = useRequireAuth();
  const roles = useMyRoles(user);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user || roles === undefined) return;
    const load = async () => {
      setErr(null);
      const today = new Date();
      const in14 = new Date(); in14.setDate(today.getDate() + 14);
      const todayStr = today.toISOString().slice(0, 10);
      const in14Str = in14.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("bookings")
        .select("id, customer_name, event_date, block_type, start_at, end_at, notes_public, status, space_id")
        .gte("event_date", todayStr)
        .lte("event_date", in14Str)
        .in("status", ["MENU_OPEN","MENU_LOCKED","DEPOSIT_PAID_HELD"])
        .order("event_date", { ascending: true })
        .order("start_at", { ascending: true, nullsFirst: true });
      if (error) setErr(error.message);
      else setRows(data ?? []);
    };
    load();
  }, [user, roles, supabase]);

  if (loading || roles === undefined) return <div className="p-6">Loading…</div>;
  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kitchen Prep — Next 14 Days</h1>
        <a href="/admin" className="px-3 py-2 rounded-md bg-gray-100">Admin</a>
      </div>
      {err && <p className="text-red-600">{err}</p>}
      <div className="rounded-xl overflow-hidden border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Block</th>
              <th className="p-3">Status</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3">{r.event_date}</td>
                <td className="p-3">{fmtTime(r.start_at)} – {fmtTime(r.end_at)}</td>
                <td className="p-3">{r.customer_name}</td>
                <td className="p-3">{r.block_type}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3 whitespace-pre-wrap">{r.notes_public ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="p-4 text-gray-500" colSpan={6}>No upcoming items in the next 14 days.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
