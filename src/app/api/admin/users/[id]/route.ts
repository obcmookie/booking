import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";
import { assertAdmin } from "@/shared/utils/assertAdmin";

const VALID_ROLES = new Set(["admin","kitchen"]);

// PATCH /api/admin/users/:id  { email?, password?, role? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ ok: false, error: "Missing user id" }, { status: 400 });

  const sb = supabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const email: string | undefined = body.email ? String(body.email).trim() : undefined;
  const password: string | undefined = body.password ? String(body.password) : undefined;
  const role: string | undefined = body.role ? String(body.role).trim() : undefined;

  if (email || password) {
    const { error: updErr } = await sb.auth.admin.updateUserById(id, { email, password });
    if (updErr) return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  if (role !== undefined) {
    if (role && !VALID_ROLES.has(role)) {
      return NextResponse.json({ ok: false, error: "role must be 'admin' or 'kitchen'" }, { status: 400 });
    }
    const { error: delErr } = await sb.from("user_roles").delete().eq("user_id", id);
    if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
    if (role) {
      const { error: insErr } = await sb.from("user_roles").insert({ user_id: id, role });
      if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ ok: false, error: "Missing user id" }, { status: 400 });

  const sb = supabaseAdmin();

  const { error: roleErr } = await sb.from("user_roles").delete().eq("user_id", id);
  if (roleErr) return NextResponse.json({ ok: false, error: roleErr.message }, { status: 500 });

  const { error } = await sb.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
