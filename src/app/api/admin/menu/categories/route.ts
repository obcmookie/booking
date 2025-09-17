import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


function admin() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); }


export async function GET() {
const { data, error } = await admin().from("menu_categories").select("id,name,sort_order").order("sort_order");
if (error) return NextResponse.json({ error: error.message }, { status: 400 });
return NextResponse.json({ categories: data });
}


export async function POST(req: NextRequest) {
const body = (await req.json()) as { name: string; sort_order?: number };
const { data, error } = await admin().from("menu_categories").insert({ name: body.name.trim(), sort_order: body.sort_order ?? 100 }).select("id").single();
if (error) return NextResponse.json({ error: error.message }, { status: 400 });
return NextResponse.json({ id: data!.id });
}