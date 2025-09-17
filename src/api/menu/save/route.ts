import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supa = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { token, items, submit } = (await req.json()) as {
      token: string;
      items: Array<{ menu_item_id: string; qty: number; session?: string; instructions?: string }>;
      submit?: boolean;
    };

    // Save via RPC (security definer, token-gated)
    const admin = supa();
    const { error: rpcErr } = await admin.rpc("rpc_save_menu_public", {
      p_token: token,
      p_items: items,
      p_submit: !!submit,
    });
    if (rpcErr) throw new Error(rpcErr.message);

    // Optional email on submit
    if (submit) {
      // Get booking + recipients
      const { data: b, error: bErr } = await admin
        .from("bookings")
        .select("id, customer_name, customer_email, event_type, requested_start_date, requested_end_date, event_date")
        .eq("menu_customer_token", token)
        .single();
      if (bErr) throw new Error(bErr.message);

      const dateStart = b.requested_start_date ?? b.event_date;
      const dateEnd = b.requested_end_date ?? b.event_date;
      const dateRange = dateStart === dateEnd ? String(dateStart) : `${dateStart}–${dateEnd}`;

      // staff list
      const { data: staff } = await admin
        .from("notification_recipients")
        .select("email")
        .eq("purpose", "NEW_INQUIRY")
        .eq("enabled", true);

      // Email customer
      await resend.emails.send({
        from: "bookings@events.umiyamatajiky.com",
        to: [b.customer_email],
        subject: "Menu submitted — thank you!",
        text:
`Hi ${b.customer_name},

We received your menu selections for "${b.event_type}" (${dateRange}).
We’ll review and follow up if anything needs clarification.

— Temple Booking Team`,
      });

      // Email staff
      const staffTo = (staff || []).map(r => r.email).filter(Boolean);
      if (staffTo.length) {
        await resend.emails.send({
          from: "bookings@events.umiyamatajiky.com",
          to: staffTo,
          subject: "Customer submitted menu selections",
          text:
`Booking: ${b.event_type} (${dateRange})
Customer: ${b.customer_name} <${b.customer_email}>

Menu selections have been submitted. Please review in Admin -> Booking -> Menu tab.`,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
