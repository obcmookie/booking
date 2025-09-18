import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";

  const supa = admin();

  let query = supa
    .from("bookings")
    .select(
      `
      id,
      event_type,
      requested_start_date,
      requested_end_date,
      event_date,
      customer_name,
      membership_status,
      status,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    const term = `%${q}%`;
    // Match on event, name, or status
    query = query.or(
      `event_type.ilike.${term},customer_name.ilike.${term},status.ilike.${term}`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ bookings: data });
}
