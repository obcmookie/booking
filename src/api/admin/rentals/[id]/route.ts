// [id]/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
function adminClient() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = adminClient();
  const body = await req.json() as Partial<{
    name: string; description: string|null; price_mode: "FLAT"|"PER_DAY"|"PER_HOUR";
    unit_price: number; category: string|null; active: boolean; sort_order: number;
  }>;
  const { error } = await admin.from("rental_items").update(body).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = adminClient();
  const { error } = await admin.from("rental_items").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
