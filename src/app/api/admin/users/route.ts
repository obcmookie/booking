import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server only
  );
}

async function assertAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Missing bearer token");
  const admin = adminClient();
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes.user) throw new Error("Invalid token");

  // check role in DB
  const { data: rows, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .eq("role", "admin")
    .limit(1);
  if (error) throw error;
  if (!rows?.length) throw new Error("Not authorized");
  return { admin, callerId: userRes.user.id };
}

export async function GET(req: NextRequest) {
  try {
    const { admin } = await assertAdmin(req);
    const search = new URL(req.url).searchParams;
    const page = Number(search.get("page") || 1);
    const perPage = 25;

    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    // also fetch roles mapping
    const ids = data?.users?.map(u => u.id) || [];
    const { data: roles } = await admin.from("user_roles").select("user_id, role").in("user_id", ids);

    return NextResponse.json({ users: data.users, roles: roles || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { admin } = await assertAdmin(req);
    const body = await req.json();
    const { email, password, role } = body as { email: string; password?: string; role: "admin" | "kitchen" };

    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (error) throw error;

    // upsert role
    if (data.user) {
      await admin.from("user_roles").upsert({ user_id: data.user.id, role }, { onConflict: "user_id,role" });
    }

    return NextResponse.json({ user: data.user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
