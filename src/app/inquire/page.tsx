// src/app/inquire/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function InquirePage() {
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOk(null); setErr(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      p_customer_name: String(form.get('name') || ''),
      p_customer_email: String(form.get('email') || ''),
      p_customer_phone: String(form.get('phone') || ''),
      p_event_type: String(form.get('event_type') || ''),
      p_event_date: String(form.get('event_date') || ''), // yyyy-mm-dd
      p_description: String(form.get('desc') || ''),
    };
    const { data, error } = await supabase.rpc('rpc_create_public_booking', payload);
    if (error) { setErr(error.message); return; }
    setOk(`Thanks! Your reference token is ${data?.[0]?.customer_token ?? '(created)'}`);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">Event Inquiry</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <input name="name" placeholder="Your name" className="w-full rounded-lg border px-3 py-2" required />
        <input name="email" placeholder="Email" type="email" className="w-full rounded-lg border px-3 py-2" required />
        <input name="phone" placeholder="Phone" className="w-full rounded-lg border px-3 py-2" required />
        <input name="event_type" placeholder="Event type (e.g., Birthday)" className="w-full rounded-lg border px-3 py-2" required />
        <input name="event_date" type="date" className="w-full rounded-lg border px-3 py-2" required />
        <textarea name="desc" placeholder="Anything else?" className="w-full rounded-lg border px-3 py-2" rows={4} />
        <button className="w-full rounded-lg bg-black py-2 text-white">Submit Inquiry</button>
      </form>
      {ok && <p className="mt-4 text-green-700 text-sm">{ok}</p>}
      {err && <p className="mt-4 text-red-700 text-sm">{err}</p>}
    </div>
  );
}
