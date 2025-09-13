// src/app/api/inquiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const eventType = (body.eventType ?? "").trim();
  const description = (body.description ?? "").trim();

  // Accept either the new range or the legacy single date
  const startDate: string | undefined = (body.startDate ?? "").trim() || undefined;
  const endDate: string | undefined = (body.endDate ?? "").trim() || undefined;
  const eventDate: string | undefined = (body.eventDate ?? "").trim() || undefined;

  if (!name || !email || (!eventDate && (!startDate || !endDate))) {
    return NextResponse.json({ ok: false, error: "name, email and a date or date range are required" }, { status: 400 });
  }
  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json({ ok: false, error: "endDate must be on or after startDate" }, { status: 400 });
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const sb = supabaseAdmin();

  // Insert booking
  const { data, error } = await sb
    .from("bookings")
    .insert({
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      event_type: eventType || "OTHER",
      status: "NEW",
      block_type: "TBD",
      // legacy single date goes into event_date (scheduled) OR we can duplicate into requested_*:
      event_date: eventDate || null,
      requested_start_date: startDate || eventDate || null,
      requested_end_date: endDate || eventDate || null,
      notes_public: description || null,
      source: "PUBLIC",
      customer_token: token,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  // Audit row
  await sb.from("booking_status_events").insert({
    booking_id: data.id,
    old_status: null,
    new_status: "NEW",
    note: startDate && endDate
      ? `Public inquiry created (range ${startDate} → ${endDate})`
      : `Public inquiry created (date ${eventDate})`,
    user_id: null,
  });

  // (Optional) send emails using your notifications module here

  return NextResponse.json({ ok: true, bookingId: data.id, token });
}
