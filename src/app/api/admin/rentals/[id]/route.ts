import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PriceMode } from "@/components/types";


function adminClient() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); }


export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
const admin = adminClient();
const patch = (await req.json()) as Partial<{
name: string; description: string | null; price_mode: PriceMode; unit_price: number; category: string | null; active: boolean; sort_order: number;
}>;
const { error } = await admin.from("rental_items").update(patch).eq("id", params.id);
if (error) return NextResponse.json({ error: error.message }, { status: 400 });
return NextResponse.json({ ok: true });
}


export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
const admin = adminClient();
const { error } = await admin.from("rental_items").delete().eq("id", params.id);
if (error) return NextResponse.json({ error: error.message }, { status: 400 });
return NextResponse.json({ ok: true });
}