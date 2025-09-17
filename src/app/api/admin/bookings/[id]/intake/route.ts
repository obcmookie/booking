import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BookingIntake, MembershipStatus } from "@/components/types";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supa = admin();
  const { data, error } = await supa
    .from("bookings")
    .select(
      `id, event_type, membership_status, requested_start_date, requested_end_date, event_date,
       customer_name, customer_email, customer_phone,
       gaam, booking_for_name, relationship_to_booker,
       address_line1, address_line2, city, state, postal_code,
       primary_space_id, primary_space_name,
       vendors_decorator_needed, vendors_decorator_notes,
       vendors_dj_needed, vendors_dj_notes,
       vendors_cleaning_needed, vendors_cleaning_notes,
       vendors_other_needed, vendors_other_notes`
    )
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const intake: BookingIntake = {
    id: data.id,
    event_type: data.event_type ?? "",
    membership_status: (data.membership_status ?? null) as MembershipStatus | null,
    primary_space_id: data.primary_space_id ?? null,
    primary_space_name: data.primary_space_name ?? null,
    requested_start_date: data.requested_start_date ?? null,
    requested_end_date: data.requested_end_date ?? null,
    event_date: data.event_date ?? null,
    customer_name: data.customer_name ?? null,
    customer_email: data.customer_email ?? null,
    customer_phone: data.customer_phone ?? null,
    gaam: data.gaam ?? null,
    booking_for_name: data.booking_for_name ?? null,
    relationship_to_booker: data.relationship_to_booker ?? null,
    address_line1: data.address_line1 ?? null,
    address_line2: data.address_line2 ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    postal_code: data.postal_code ?? null,
    vendors_decorator_needed: Boolean(data.vendors_decorator_needed),
    vendors_decorator_notes: data.vendors_decorator_notes ?? null,
    vendors_dj_needed: Boolean(data.vendors_dj_needed),
    vendors_dj_notes: data.vendors_dj_notes ?? null,
    vendors_cleaning_needed: Boolean(data.vendors_cleaning_needed),
    vendors_cleaning_notes: data.vendors_cleaning_notes ?? null,
    vendors_other_needed: Boolean(data.vendors_other_needed),
    vendors_other_notes: data.vendors_other_notes ?? null,
  };

  return NextResponse.json({ intake });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const body = (await req.json()) as BookingIntake;

  const patch = {
    event_type: body.event_type,
    membership_status: body.membership_status,
    primary_space_id: body.primary_space_id,
    primary_space_name: body.primary_space_name,
    requested_start_date: body.requested_start_date,
    requested_end_date: body.requested_end_date,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    customer_phone: body.customer_phone,
    gaam: body.gaam,
    booking_for_name: body.booking_for_name,
    relationship_to_booker: body.relationship_to_booker,
    address_line1: body.address_line1,
    address_line2: body.address_line2,
    city: body.city,
    state: body.state,
    postal_code: body.postal_code,
    vendors_decorator_needed: body.vendors_decorator_needed,
    vendors_decorator_notes: body.vendors_decorator_notes,
    vendors_dj_needed: body.vendors_dj_needed,
    vendors_dj_notes: body.vendors_dj_notes,
    vendors_cleaning_needed: body.vendors_cleaning_needed,
    vendors_cleaning_notes: body.vendors_cleaning_notes,
    vendors_other_needed: body.vendors_other_needed,
    vendors_other_notes: body.vendors_other_notes,
  };

  const { error } = await admin().from("bookings").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
