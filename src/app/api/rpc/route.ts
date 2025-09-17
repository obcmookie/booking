import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


function admin() {
return createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
}


export async function GET(req: NextRequest) {
const fn = req.nextUrl.searchParams.get("fn");
const token = req.nextUrl.searchParams.get("token");
if (fn !== "rpc_get_menu_public" || !token) return NextResponse.json({ error: "bad request" }, { status: 400 });
const { data, error } = await admin().rpc("rpc_get_menu_public", { p_token: token });
if (error) return NextResponse.json({ error: error.message }, { status: 400 });
return NextResponse.json({ rows: data });
}