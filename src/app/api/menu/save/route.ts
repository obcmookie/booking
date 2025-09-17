import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";


const resend = new Resend(process.env.RESEND_API_KEY!);


function admin() {
return createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
}


interface PayloadItem { menu_item_id: string; qty: number; session: string | null; instructions: string | null; }


export async function POST(req: NextRequest) {
try {
const { token, items, submit } = (await req.json()) as { token: string; items: PayloadItem[]; submit?: boolean };


const supa = admin();
const { error: rpcErr } = await supa.rpc("rpc_save_menu_public", {
p_token: token,
p_items: items,
p_submit: Boolean(submit),
});
if (rpcErr) throw new Error(rpcErr.message);


if (submit) {
const { data: b, error: bErr } = await supa
.from("bookings")
.select("id, customer_name, customer_email, event_type, requested_start_date, requested_end_date, event_date")
.eq("menu_customer_token", token)
.single();
if (bErr) throw new Error(bErr.message);


}