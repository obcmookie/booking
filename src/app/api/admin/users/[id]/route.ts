import "server-only";
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

type Role = "admin" | "kitchen";
type RoleRow = { user_id: string; role: Role };

type ListedUser = {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
};

type GetUserPayload = {
  user: ListedUser | null;
  role: Role | null;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

/** Extract the dynamic :id segment from the request URL. */
function getIdFromRequest(req: Request): string {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] ?? "";
  return decodeURIComponent(last);
}

/** Verify caller is authenticated and has admin role. */
async function assertAdmin(req: Request): Promise<{ admin: SupabaseClient; userId: string }> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Missing bearer token");

  const admin = adminClient();
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes?.user) throw new Error("Invalid token");

  const userId = userRes.user.id;

  const { data: roles, error: roleErr } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);

  if (roleErr) throw new Error(roleErr.message);
  if (!roles || roles.length === 0) throw new Error("Forbidden");

  return { admin, userId };
}

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "kitchen";
}

type PatchPayload = { role: Role };
function isPatchPayload(x: unknown): x is PatchPayload {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  return isRole(obj.role);
}

/** GET /api/admin/users/:id — Return one auth user + their role (if any). */
export async function GET(req: Request) {
  try {
    const { admin } = await assertAdmin(req);
    const userId = getIdFromRequest(req);

    const { data: userRes, error: getErr } = await admin.auth.admin.getUserById(userId);
    if (getErr) throw new Error(getErr.message);

    const listed: ListedUser | null = userRes.user
      ? {
          id: userRes.user.id,
          email: userRes.user.email ?? null,
          created_at: userRes.user.created_at ?? null,
          last_sign_in_at: userRes.user.last_sign_in_at ?? null,
        }
      : null;

    let role: Role | null = null;
    if (listed) {
      const { data: roleRows, error: rolesErr } = await admin
        .from("user_roles")
        .select("user_id, role")
        .eq("user_id", userId)
        .limit(1);

      if (rolesErr) throw new Error(rolesErr.message);
      if (roleRows && roleRows.length > 0) {
        const r = roleRows[0] as RoleRow;
        role = r.role;
      }
    }

    const payload: GetUserPayload = { user: listed, role };
    return NextResponse.json(payload);
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 401 });
  }
}

/** PATCH /api/admin/users/:id — Body: { role: "admin" | "kitchen" } */
export async function PATCH(req: Request) {
  try {
    const { admin } = await assertAdmin(req);
    const userId = getIdFromRequest(req);

    const bodyUnknown: unknown = await req.json();
    if (!isPatchPayload(bodyUnknown)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { role } = bodyUnknown;

    const { data: userRes, error: getErr } = await admin.auth.admin.getUserById(userId);
    if (getErr) throw new Error(getErr.message);
    if (!userRes.user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { error: upsertErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });
    if (upsertErr) throw new Error(upsertErr.message);

    return NextResponse.json({ ok: true, role });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 401 });
  }
}

/** DELETE /api/admin/users/:id — Delete role mapping and auth user. */
export async function DELETE(req: Request) {
  try {
    const { admin } = await assertAdmin(req);
    const userId = getIdFromRequest(req);

    const { error: delRoleErr } = await admin.from("user_roles").delete().eq("user_id", userId);
    if (delRoleErr) throw new Error(delRoleErr.message);

    const { error: delUserErr } = await admin.auth.admin.deleteUser(userId);
    if (delUserErr) throw new Error(delUserErr.message);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 401 });
  }
}
