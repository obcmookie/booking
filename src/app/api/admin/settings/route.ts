import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


function adminClient() {
return createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
}


export async function GET() {
const admin = adminClient();
const { data, error } = await admin.from("app_settings").select("key,value").order("key");
if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
return NextResponse.json({ ok: true, settings: data });
}


export async function POST(req: NextRequest) {
try {
const body = (await req.json()) as { settings: Array<{ key: string; value: Record<string, unknown> }> };
const rows = body.settings ?? [];
const admin = adminClient();
for (const r of rows) {
const { error } = await admin
.from("app_settings")
.upsert({ key: r.key, value: r.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
if (error) throw new Error(error.message);
}
return NextResponse.json({ ok: true });
} catch (e) {
const msg = e instanceof Error ? e.message : "Unknown error";
return NextResponse.json({ ok: false, error: msg }, { status: 400 });
}
}