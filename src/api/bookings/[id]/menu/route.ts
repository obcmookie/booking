import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = adminClient();
  const { data, error } = await admin.rpc("rpc_open_menu", { p_booking_id: params.id }).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ token: data?.menu_token });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = adminClient();
  const { error } = await admin.rpc("rpc_lock_menu", { p_booking_id: params.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
