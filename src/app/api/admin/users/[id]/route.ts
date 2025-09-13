import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function assertAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Missing bearer token");
  const admin = adminClient();
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes.user) throw new Error("Invalid token");

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, callerId } = await assertAdmin(req);
    const id = params.id;
    const body = await req.json();
    const { email, role } = body as { email?: string; role?: "admin" | "kitchen" };

    if (email) {
      const { error } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true });
      if (error) throw error;
    }
    if (role) {
      // clear both roles for this user then set one (only admin or kitchen in this app)
      await admin.from("user_roles").delete().eq("user_id", id).in("role", ["admin","kitchen"]);
      await admin.from("user_roles").upsert({ user_id: id, role }, { onConflict: "user_id,role" });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, callerId } = await assertAdmin(req);
    const id = params.id;
    if (id === callerId) throw new Error("You cannot delete your own account.");

    // remove roles first (best effort)
    await admin.from("user_roles").delete().eq("user_id", id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
