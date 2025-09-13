import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
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

type UsersPayload = {
  users: ListedUser[];
  roles: RoleRow[];
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

async function assertAdmin(req: NextRequest): Promise<{ admin: SupabaseClient; userId: string }> {
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

type CreateUserPayload = {
  email: string;
  password?: string;
  role: Role;
};

function isCreateUserPayload(x: unknown): x is CreateUserPayload {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  if (typeof obj.email !== "string") return false;
  if (obj.password !== undefined && typeof obj.password !== "string") return false;
  if (!isRole(obj.role)) return false;
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const { admin } = await assertAdmin(req);

    // List users via Admin API
    const { data: list, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw new Error(listErr.message);

    const users: ListedUser[] =
      list?.users.map((u) => ({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
      })) ?? [];

    // Fetch roles for these users
    const userIds = users.map((u) => u.id);
    let roles: RoleRow[] = [];
    if (userIds.length) {
      const { data: roleRows, error: rolesErr } = await admin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesErr) throw new Error(rolesErr.message);
      roles = (roleRows as RoleRow[]) ?? [];
    }

    const payload: UsersPayload = { users, roles };
    return NextResponse.json(payload);
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { admin } = await assertAdmin(req);

    const bodyUnknown: unknown = await req.json();
    if (!isCreateUserPayload(bodyUnknown)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { email, password, role } = bodyUnknown;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);

    const newUser = data.user;
    if (!newUser) throw new Error("User not returned from Supabase");

    // Upsert role for the new user. Adjust onConflict to match your unique index.
    const { error: upsertErr } = await admin
      .from("user_roles")
      .upsert({ user_id: newUser.id, role }, { onConflict: "user_id" });
    if (upsertErr) throw new Error(upsertErr.message);

    const response = {
      user: {
        id: newUser.id,
        email: newUser.email ?? null,
        created_at: newUser.created_at ?? null,
        last_sign_in_at: newUser.last_sign_in_at ?? null,
      } as ListedUser,
    };
    return NextResponse.json(response);
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 401 });
  }
}
