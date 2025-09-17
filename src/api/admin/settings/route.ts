import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Reuse your adminClient + assertAdmin style
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  try {
    const admin = adminClient();
    const { data, error } = await admin.from("app_settings").select("key,value").order("key");
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, settings: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = adminClient();
    const body = (await req.json()) as { settings: Array<{ key: string; value: unknown }> };
    const rows = body.settings ?? [];
    for (const r of rows) {
      const { error } = await admin
        .from("app_settings")
        .upsert({ key: r.key, value: r.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
