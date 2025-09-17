import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("category_id");

  let q = admin()
    .from("menu_items")
    .select("id,category_id,name,veg,price")
    .order("name");

  if (categoryId) q = q.eq("category_id", categoryId);

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    name: string;
    category_id: string | null;
    veg: boolean;
    price: number | null;
  };

  const { data, error } = await admin()
    .from("menu_items")
    .insert({
      name: body.name.trim(),
      category_id: body.category_id,
      veg: body.veg,
      price: body.price,
      // keep DB happy if columns exist; UI doesn't expose these
      active: true,
      spice: null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data!.id });
}
