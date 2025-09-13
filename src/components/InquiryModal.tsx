"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  defaultStart?: Date | null;
  defaultEnd?: Date | null;
  onClose(): void;
};

export function InquiryModal({ open, defaultStart, defaultEnd, onClose }: Props) {
  const [customer_name, setName] = useState("");
  const [customer_email, setEmail] = useState("");
  const [customer_phone, setPhone] = useState("");
  const [event_type, setType] = useState("");
  const [description, setDesc] = useState("");
  const [start, setStart] = useState<string>(defaultStart ? defaultStart.toISOString().slice(0,10) : "");
  const [end, setEnd] = useState<string>(defaultEnd ? defaultEnd.toISOString().slice(0,10) : "");
  const [loading, setLoading] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true); setErr(null);
    const p_event_date = start || end || new Date().toISOString().slice(0,10);
    const { data, error } = await supabase.rpc("rpc_create_public_booking", {
      p_customer_name: customer_name,
      p_customer_email: customer_email,
      p_customer_phone: customer_phone,
      p_event_type: event_type,
      p_event_date, // legacy field; we also pass range:
      p_description: description || null,
      p_requested_start_date: start || null,
      p_requested_end_date: end || start || null,
    });

    if (error) { setErr(error.message); setLoading(false); return; }
    const [row] = data as { booking_id: string; customer_token: string }[];
    setDoneId(row.booking_id);

    // fire email (server-side)
    try {
      await fetch("/api/mail/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: row.booking_id }),
      });
    } catch {}

    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-lg rounded bg-white p-4 shadow">
        {!doneId ? <>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">New Inquiry</h2>
            <button onClick={onClose} className="text-sm text-slate-500">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="text-sm">Name</label>
              <input className="w-full border rounded p-2" value={customer_name} onChange={e=>setName(e.target.value)} /></div>
            <div><label className="text-sm">Email</label>
              <input type="email" className="w-full border rounded p-2" value={customer_email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><label className="text-sm">Phone</label>
              <input className="w-full border rounded p-2" value={customer_phone} onChange={e=>setPhone(e.target.value)} /></div>
            <div><label className="text-sm">Event type</label>
              <input className="w-full border rounded p-2" value={event_type} onChange={e=>setType(e.target.value)} placeholder="e.g., Birthday, Wedding" /></div>
            <div><label className="text-sm">Preferred start date</label>
              <input type="date" className="w-full border rounded p-2" value={start} onChange={e=>setStart(e.target.value)} /></div>
            <div><label className="text-sm">Preferred end date</label>
              <input type="date" className="w-full border rounded p-2" value={end} onChange={e=>setEnd(e.target.value)} /></div>
            <div className="md:col-span-2"><label className="text-sm">Notes (optional)</label>
              <textarea className="w-full border rounded p-2" rows={3} value={description} onChange={e=>setDesc(e.target.value)} /></div>
          </div>
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          <div className="mt-3 flex gap-2 justify-end">
            <button onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button disabled={loading} onClick={submit} className="px-3 py-2 rounded bg-slate-900 text-white">
              {loading ? "Submitting..." : "Submit Inquiry"}
            </button>
          </div>
        </> : <>
          <div className="mb-3">
            <h2 className="font-semibold">Thanks!</h2>
            <p className="text-sm text-slate-600">Your inquiry was received. We’ll follow up by email.</p>
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-3 py-2 rounded bg-slate-900 text-white">Done</button>
          </div>
        </>}
      </div>
    </div>
  );
}
