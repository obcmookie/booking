import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const { booking_id } = (await req.json()) as { booking_id?: string };
    if (!booking_id) return NextResponse.json({ error: "booking_id required" }, { status: 400 });

    const supa = adminClient();
    const { data: b, error } = await supa
      .from("bookings")
      .select("id, customer_name, customer_email, customer_phone, event_type, requested_start_date, requested_end_date, event_date, notes_public")
      .eq("id", booking_id).single();
    if (error) throw new Error(error.message);

    const { data: recipients } = await supa
      .from("notification_recipients")
      .select("email")
      .eq("purpose","NEW_INQUIRY")
      .eq("enabled", true);

    const dateRange = (b.requested_start_date || b.event_date) +
      " → " + (b.requested_end_date || b.requested_start_date || b.event_date);

    await resend.emails.send({
      from: "bookings@events.umiyamatajiky.com",
      to: b.customer_email,
      subject: "We received your inquiry",
      text: `Hi ${b.customer_name},

Thank you for your inquiry for "${b.event_type}" (${dateRange}).
We’ll get back to you shortly.

— Temple Booking Team`,
    });

    const staffTo = (recipients || []).map(r => r.email).filter(Boolean) as string[];
    if (staffTo.length) {
      await resend.emails.send({
        from: "bookings@events.umiyamatajiky.com",
        to: staffTo,
        subject: "New Booking Inquiry",
        text: `New inquiry:
Name: ${b.customer_name}
Email: ${b.customer_email}
Phone: ${b.customer_phone}
Type: ${b.event_type}
Dates: ${dateRange}
Notes: ${b.notes_public || "-"}

Booking ID: ${b.id}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
