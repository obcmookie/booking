"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/modules/auth/useRequireAuth";
import { supabaseBrowser } from "@/modules/auth/supabaseBrowser";

type Booking = {
  id: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_type: string;
  event_date: string | null;
  requested_start_date: string | null; // if you added the date-range migration
  requested_end_date: string | null;   // if you added the date-range migration
  space_id: string | null;
  block_type: "TBD" | "FULL_DAY" | "HALF_AM" | "HALF_PM" | "CUSTOM";
  start_at: string | null;
  end_at: string | null;
  status: string;
  notes_internal: string | null;
  notes_public: string | null;
};

type Space = { id: string; name: string };

type StatusEvent = {
  id: number;
  created_at: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  user_id: string | null;
};

type AssignPayload = {
  spaceId: string | null;
  blockType: "FULL_DAY" | "HALF_AM" | "HALF_PM" | "CUSTOM";
  startAt?: string | null;
  endAt?: string | null;
};

function fmtDateTime(ts: string | null) {
  if (!ts) return "—";
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}
function isoLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useRequireAuth("/admin/login");
  const supabase = useMemo(supabaseBrowser, []);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Assign Block modal state
  const [open, setOpen] = useState(false);
  const [spaceId, setSpaceId] = useState<string | "">("");
  const [blockType, setBlockType] = useState<AssignPayload["blockType"]>("FULL_DAY");
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      setErr(null);
      const { data: b, error: be } = await supabase.from("bookings").select("*").eq("id", id).single();
      if (be) { setErr(be.message); return; }
      setBooking(b as Booking);

      const { data: sp } = await supabase
        .from("spaces")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });
      setSpaces((sp ?? []) as Space[]);

      const { data: ev } = await supabase
        .from("booking_status_events")
        .select("id, created_at, old_status, new_status, note, user_id")
        .eq("booking_id", id)
        .order("created_at", { ascending: false });
      setEvents((ev ?? []) as StatusEvent[]);
    };
    run();
  }, [user, id, supabase]);

  useEffect(() => {
    if (!booking) return;
    setSpaceId(booking.space_id ?? "");
    setBlockType(booking.block_type === "TBD" ? "FULL_DAY" : booking.block_type);
    if (booking.start_at) setStartAt(isoLocal(new Date(booking.start_at)));
    if (booking.end_at) setEndAt(isoLocal(new Date(booking.end_at)));
  }, [booking]);

  const submitAssign = async () => {
    if (!booking) return;
    setBusy(true); setErr(null);

    // Include Bearer token like the Users API does
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const payload: AssignPayload = {
      spaceId: spaceId || null,
      blockType,
      startAt: blockType === "CUSTOM" ? (startAt ? new Date(startAt).toISOString() : null) : undefined,
      endAt: blockType === "CUSTOM" ? (endAt ? new Date(endAt).toISOString() : null) : undefined,
    };

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/assign-block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to assign block");

      // reload booking + events
      const { data: b } = await supabase.from("bookings").select("*").eq("id", booking.id).single();
      setBooking(b as Booking);
      const { data: ev } = await supabase
        .from("booking_status_events")
        .select("id, created_at, old_status, new_status, note, user_id")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: false });
      setEvents((ev ?? []) as StatusEvent[]);
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to assign block";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!booking) return <div className="p-6">Loading booking…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{booking.customer_name}</h1>
          <p className="text-sm text-gray-600">
            {booking.event_type} • {booking.event_date ? `Scheduled ${booking.event_date}` : "Not yet scheduled"}
          </p>
          <p className="text-sm text-gray-600">{booking.customer_email} • {booking.customer_phone}</p>
        </div>
        <a href="/admin" className="px-3 py-2 rounded-md bg-gray-100">Back</a>
      </div>

      {/* Sticky action bar */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-white/80 backdrop-blur border-b flex items-center gap-3">
        <button
          className="rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
          onClick={() => setOpen(true)}
        >
          Assign Block
        </button>
        <span className="text-sm text-gray-600">Status: <span className="font-medium">{booking.status}</span></span>
        {err && <span className="text-red-600 text-sm ml-auto">{err}</span>}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <section className="rounded-xl border p-4">
            <h2 className="font-semibold mb-2">Details</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-gray-500">Requested window</dt>
              <dd>{booking.requested_start_date && booking.requested_end_date ? `${booking.requested_start_date} → ${booking.requested_end_date}` : "—"}</dd>
              <dt className="text-gray-500">Space</dt>
              <dd>{spaces.find(s => s.id === booking.space_id)?.name ?? "—"}</dd>
              <dt className="text-gray-500">Block Type</dt>
              <dd>{booking.block_type}</dd>
              <dt className="text-gray-500">Start</dt>
              <dd>{fmtDateTime(booking.start_at)}</dd>
              <dt className="text-gray-500">End</dt>
              <dd>{fmtDateTime(booking.end_at)}</dd>
              <dt className="text-gray-500">Notes (public)</dt>
              <dd className="whitespace-pre-wrap">{booking.notes_public ?? "—"}</dd>
              <dt className="text-gray-500">Notes (internal)</dt>
              <dd className="whitespace-pre-wrap">{booking.notes_internal ?? "—"}</dd>
            </dl>
          </section>
        </div>
        <div className="space-y-4">
          <section className="rounded-xl border p-4">
            <h2 className="font-semibold mb-2">Timeline</h2>
            <ul className="space-y-2 text-sm">
              {events.map(e => (
                <li key={e.id} className="border rounded-md p-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{e.new_status}</span>
                    <span className="text-gray-500">{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                  {e.note && <p className="text-gray-700 mt-1">{e.note}</p>}
                </li>
              ))}
              {events.length === 0 && <li className="text-gray-500">No history yet.</li>}
            </ul>
          </section>
        </div>
      </div>

      {/* Assign Block Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Assign Block</h3>
              <button className="text-sm" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="grid gap-3">
              <label className="text-sm">Space</label>
              <select className="rounded-md border p-2" value={spaceId} onChange={e=>setSpaceId(e.target.value)}>
                <option value="">(none)</option>
                {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <label className="text-sm mt-2">Block Type</label>
              <select className="rounded-md border p-2" value={blockType} onChange={e=>setBlockType(e.target.value as AssignPayload["blockType"])}>
                <option value="FULL_DAY">FULL_DAY</option>
                <option value="HALF_AM">HALF_AM</option>
                <option value="HALF_PM">HALF_PM</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>

              {blockType === "CUSTOM" && (
                <>
                  <label className="text-sm mt-2">Start</label>
                  <input className="rounded-md border p-2" type="datetime-local" value={startAt} onChange={e=>setStartAt(e.target.value)} />
                  <label className="text-sm">End</label>
                  <input className="rounded-md border p-2" type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} />
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button className="rounded-md bg-gray-100 px-3 py-2" onClick={()=>setOpen(false)}>Cancel</button>
                <button className="rounded-md bg-blue-600 text-white px-3 py-2 disabled:opacity-50" disabled={busy} onClick={submitAssign}>
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">For CUSTOM, choose start/end. For FULL_DAY/HALF_* we’ll use sensible defaults on the event date.</p>
          </div>
        </div>
      )}
    </div>
  );
}
