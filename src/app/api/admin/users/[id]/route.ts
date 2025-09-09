import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";
import { assertAdmin } from "@/shared/utils/assertAdmin";


// PATCH /api/admin/users/:id { email?, password?, role? }
export async function PATCH(req: NextRequest, { params }: { params: { id: string }}) {
const auth = await assertAdmin(req);
if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
const id = params.id;
const body = await req.json().catch(() => ({}));
const email: string | undefined = body.email?.trim() || undefined;
const password: string | undefined = body.password || undefined;
const role: string | undefined = body.role?.trim() || undefined;


const sb = supabaseAdmin();
if (!email && !password && !role) {
return NextResponse.json({ ok: false, error: "No changes provided" }, { status: 400 });
}


if (email || password) {
const { error } = await sb.auth.admin.updateUserById(id, { email, password });
if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
}


if (role) {
// Replace roles with single role for now
const { error: delErr } = await sb.from("user_roles").delete().eq("user_id", id);
if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
const { error: insErr } = await sb.from("user_roles").insert({ user_id: id, role });
if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
}


return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string }}) {
const auth = await assertAdmin(req);
if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });


const id = params.id;
const sb = supabaseAdmin();
const { error } = await sb.auth.admin.deleteUser(id);
if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
return NextResponse.json({ ok: true });
}