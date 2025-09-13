import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function assertAdmin(req: NextRequest): Promise<{ admin: SupabaseClient; callerId: string }> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Missing bearer token");
  const admin = adminClient();
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes?.user) throw new Error("Invalid token");

  const { data: rows, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .eq("role", "admin")
    .limit(1);
  if (error) throw new Error(error.message);
  if (!rows?.length) throw new Error("Not authorized");
  return { admin, callerId: userRes.user.id };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin } = await assertAdmin(req);
    const id = params.id;
    const body = await req.json() as { email?: string; role?: "admin" | "kitchen" };
    const { email, role } = body;

    if (email) {
      const { error } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true });
      if (error) throw new Error(error.message);
    }
    if (role) {
      await admin.from("user_roles").delete().eq("user_id", id).in("role", ["admin","kitchen"]);
      await admin.from("user_roles").upsert({ user_id: id, role }, { onConflict: "user_id,role" });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, callerId } = await assertAdmin(req);
    const id = params.id;
    if (id === callerId) throw new Error("You cannot delete your own account.");

    await admin.from("user_roles").delete().eq("user_id", id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
