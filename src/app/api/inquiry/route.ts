import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";

type InquiryBody = {
  name?: string;
  email?: string;
  phone?: string;
  eventType?: string;
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  eventDate?: string;   // legacy single date (optional)
  description?: string;
};

export async function POST(req: NextRequest) {
  let body: InquiryBody;
  try {
    body = (await req.json()) as InquiryBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const eventType = (body.eventType ?? "").trim();
  const startDate = (body.startDate ?? "").trim() || undefined;
  const endDate = (body.endDate ?? "").trim() || undefined;
  const eventDate = (body.eventDate ?? "").trim() || undefined; // legacy
  const description = (body.description ?? "").trim();

  if (!name || !email || (!eventDate && (!startDate || !endDate))) {
    return NextResponse.json({ ok: false, error: "name, email and a date or date range are required" }, { status: 400 });
  }
  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json({ ok: false, error: "endDate must be on or after startDate" }, { status: 400 });
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("bookings")
    .insert({
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      event_type: eventType || "OTHER",
      status: "NEW",
      block_type: "TBD",
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

  await sb.from("booking_status_events").insert({
    booking_id: data.id,
    old_status: null,
    new_status: "NEW",
    note: startDate && endDate
      ? `Public inquiry created (range ${startDate} → ${endDate})`
      : `Public inquiry created (date ${eventDate})`,
    user_id: null,
  });

  return NextResponse.json({ ok: true, bookingId: data.id, token });
}
