import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabaseAdmin";


export async function assertAdmin(req: NextRequest) {
const auth = req.headers.get("authorization") || "";
const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;
if (!token) return { ok: false as const, status: 401, error: "Missing bearer token" };


const sb = supabaseAdmin();
const { data: userRes, error: userErr } = await sb.auth.getUser(token);
if (userErr || !userRes.user) return { ok: false as const, status: 401, error: "Invalid token" };


// Check admin role in our table
const { data: role, error: roleErr } = await sb
.from("user_roles")
.select("role")
.eq("user_id", userRes.user.id)
.eq("role", "admin")
.maybeSingle();


if (roleErr) return { ok: false as const, status: 500, error: roleErr.message };
if (!role) return { ok: false as const, status: 403, error: "Admin role required" };


return { ok: true as const, user: userRes.user };
}