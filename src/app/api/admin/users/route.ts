import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";
import { assertAdmin } from "@/shared/utils/assertAdmin";

// GET /api/admin/users?page=1&perPage=50&search=foo
export async function GET(req: NextRequest) {
  const auth = await assertAdmin(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Math.min(100, Number(searchParams.get("perPage") ?? "25"));
  const search = (searchParams.get("search") ?? "").trim();

  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  let users = data.users || [];
  if (search) {
    const s = search.toLowerCase();
    users = users.filter(u => (u.email ?? "").toLowerCase().includes(s) || (u.user_metadata?.name ?? "").toLowerCase().includes(s));
  }

  const ids = users.map(u => u.id);
  const roles: Record<string, string[]> = {};
  if (ids.length) {
    const { data: r } = await sb.from("user_roles").select("user_id, role").in("user_id", ids);
    (r ?? []).forEach(row => {
      if (!roles[row.user_id]) roles[row.user_id] = [];
      roles[row.user_id].push(row.role);
    });
  }

  return NextResponse.json({
    ok: true,
    page, perPage,
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      roles: roles[u.id] ?? []
    }))
  });
}

// POST /api/admin/users  { email, password, role }
export async function POST(req: NextRequest) {
  const auth = await assertAdmin(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const sb = supabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const email: string = (body.email ?? "").trim();
  const password: string = body.password ?? "";
  const role: string = (body.role ?? "").trim();

  if (!email || !password || !role) {
    return NextResponse.json({ ok: false, error: "email, password, and role are required" }, { status: 400 });
  }

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Failed to create user" }, { status: 500 });
  }

  const { error: roleErr } = await sb
    .from("user_roles")
    .insert({ user_id: data.user.id, role });
  if (roleErr) {
    await sb.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ ok: false, error: roleErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user: { id: data.user.id, email: data.user.email, roles: [role] } }, { status: 201 });
}
