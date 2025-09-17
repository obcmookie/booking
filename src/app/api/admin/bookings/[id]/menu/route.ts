import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BookingMenuInfo, MealType } from "@/components/types";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supa = admin();

  const { data: b, error: bErr } = await supa
    .from("bookings")
    .select("id,event_type,status,requested_start_date,requested_end_date,event_date,menu_template_id,menu_customer_token")
    .eq("id", id)
    .single();
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 400 });

  const dateStart = b.requested_start_date ?? b.event_date;
  const dateEnd = b.requested_end_date ?? b.event_date;

  const { data: templates } = await supa.from("menu_templates").select("id,name").order("name");

  const { data: selections } = await supa
    .from("menu_selections")
    .select("qty,session,instructions, menu_item_id:menu_item_id")
    .eq("booking_id", id);

  const itemIds = (selections ?? []).map((s) => s.menu_item_id);
  const { data: items } = itemIds.length
    ? await supa.from("menu_items").select("id,name,category_id").in("id", itemIds)
    : { data: [], error: null as any };

  const catIds = Array.from(new Set((items ?? []).map((i) => i.category_id)));
  const { data: cats } = catIds.length
    ? await supa.from("menu_categories").select("id,name").in("id", catIds)
    : { data: [], error: null as any };

  const itemName = new Map<string, string>((items ?? []).map((i) => [i.id, i.name]));
  const catName = new Map<string, string>((cats ?? []).map((c) => [c.id, c.name]));

  const info: BookingMenuInfo = {
    booking_id: b.id,
    event_type: b.event_type,
    status: b.status,
    date_start: String(dateStart),
    date_end: String(dateEnd),
    menu_template_id: b.menu_template_id,
    menu_token: b.menu_customer_token,
    templates: (templates ?? []).map((t) => ({ id: t.id, name: t.name })),
    selections: (selections ?? []).map((s) => ({
      item_id: s.menu_item_id,
      item_name: itemName.get(s.menu_item_id) ?? "(item)",
      category_name:
        catName.get((items ?? []).find((i) => i.id === s.menu_item_id)?.category_id ?? "") ?? "",
      qty: s.qty,
      session: (s.session ?? null) as MealType | null,
      instructions: s.instructions ?? null,
    })),
  };

  return NextResponse.json({ info });
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { data, error } = await admin().rpc("rpc_open_menu", { p_booking_id: id }).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ token: data?.menu_token });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { menu_template_id: string | null };
  const { error } = await admin().from("bookings").update({ menu_template_id: body.menu_template_id }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { error } = await admin().rpc("rpc_lock_menu", { p_booking_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
