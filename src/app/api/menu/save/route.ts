import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface PayloadItem {
  menu_item_id: string;
  qty: number;
  session: string | null;
  instructions: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const { token, items, submit } = (await req.json()) as {
      token: string;
      items: PayloadItem[];
      submit?: boolean;
    };

    const supa = admin();

    // Save selections via RPC
    const { error: rpcErr } = await supa.rpc("rpc_save_menu_public", {
      p_token: token,
      p_items: items,
      p_submit: Boolean(submit),
    });
    if (rpcErr) throw new Error(rpcErr.message);

    // On submit, send emails to customer + staff
    if (submit) {
      const { data: b, error: bErr } = await supa
        .from("bookings")
        .select(
          "id, customer_name, customer_email, event_type, requested_start_date, requested_end_date, event_date",
        )
        .eq("menu_customer_token", token)
        .single();

      if (bErr) throw new Error(bErr.message);

      const dateStart = b.requested_start_date ?? b.event_date;
      const dateEnd = b.requested_end_date ?? b.event_date;
      const dateRange =
        dateStart === dateEnd ? String(dateStart) : `${dateStart}–${dateEnd}`;

      // Staff recipients (reuse NEW_INQUIRY list)
      const { data: staff } = await supa
        .from("notification_recipients")
        .select("email")
        .eq("purpose", "NEW_INQUIRY")
        .eq("enabled", true);

      // Customer receipt
      if (b.customer_email) {
        await resend.emails.send({
          from: "bookings@events.umiyamatajiky.com",
          to: [b.customer_email],
          subject: "Menu submitted — thank you!",
          text: `Hi ${b.customer_name || "there"},\n\nWe received your menu selections for "${b.event_type}" (${dateRange}).\nWe’ll review and follow up if anything needs clarification.\n\n— Temple Booking Team`,
        });
      }

      // Staff notification
      const staffTo = (staff || [])
        .map((r: { email: string | null }) => r.email)
        .filter((e: string | null): e is string => Boolean(e));

      if (staffTo.length) {
        await resend.emails.send({
          from: "bookings@events.umiyamatajiky.com",
          to: staffTo,
          subject: "Customer submitted menu selections",
          text: `Menu selections submitted for ${b.event_type} (${dateRange}).\nReview in Admin → Booking → Menu tab.`,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
