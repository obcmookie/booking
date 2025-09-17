// route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
function adminClient() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); }

export async function GET() {
  const admin = adminClient();
  const { data, error } = await admin.from("rental_items")
    .select("id,name,description,price_mode,unit_price,category,active,sort_order")
    .order("active", { ascending: false })
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const admin = adminClient();
  const body = await req.json() as {
    name: string; description?: string; price_mode: "FLAT"|"PER_DAY"|"PER_HOUR";
    unit_price: number; category?: string|null; active?: boolean; sort_order?: number;
  };
  const { data, error } = await admin.from("rental_items").insert({
    name: body.name.trim(),
    description: body.description ?? null,
    price_mode: body.price_mode,
    unit_price: body.unit_price,
    category: body.category ?? null,
    active: body.active ?? true,
    sort_order: body.sort_order ?? 100,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data!.id });
}
