import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";
import { assertAdmin } from "@/shared/utils/assertAdmin";

const BLOCKS = new Set(["FULL_DAY","HALF_AM","HALF_PM","CUSTOM"] as const);
type BlockType = "FULL_DAY"|"HALF_AM"|"HALF_PM"|"CUSTOM";

type Body = {
  spaceId: string | null;
  blockType: BlockType;
  startAt?: string | null;
  endAt?: string | null;
};

function defaultsFor(dateStr: string, block: BlockType) {
  const base = new Date(dateStr + "T00:00:00");
  const set = (d: Date, h: number, m: number) => { d.setHours(h, m, 0, 0); return d; };
  switch (block) {
    case "FULL_DAY": return { start: set(new Date(base), 9, 0).toISOString(), end: set(new Date(base), 21, 0).toISOString() };
    case "HALF_AM":  return { start: set(new Date(base), 9, 0).toISOString(), end: set(new Date(base), 13, 0).toISOString() };
    case "HALF_PM":  return { start: set(new Date(base), 14, 0).toISOString(), end: set(new Date(base), 18, 0).toISOString() };
    default:         return { start: null as string | null, end: null as string | null };
  }
}

// POST /api/admin/bookings/:id/assign-block
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin(req); // expects a Bearer token (we send it from the page)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ ok: false, error: "Missing booking id" }, { status: 400 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const spaceId = body.spaceId ?? null;
  const blockType = body.blockType;
  if (!BLOCKS.has(blockType)) return NextResponse.json({ ok: false, error: "Invalid blockType" }, { status: 400 });

  const sb = supabaseAdmin();
  // We’ll use event_date or (if you added date-range) requested_start_date as the base for defaults
  const { data: booking, error: loadErr } = await sb
    .from("bookings")
    .select("id, event_date, requested_start_date, status")
    .eq("id", id)
    .single();
  if (loadErr || !booking) return NextResponse.json({ ok: false, error: loadErr?.message ?? "Booking not found" }, { status: 404 });

  let startISO: string | null = null, endISO: string | null = null;

  if (blockType === "CUSTOM") {
    startISO = body.startAt ?? null;
    endISO = body.endAt ?? null;
    if (!startISO || !endISO) return NextResponse.json({ ok: false, error: "startAt and endAt required for CUSTOM" }, { status: 400 });
    if (new Date(startISO).getTime() >= new Date(endISO).getTime()) {
      return NextResponse.json({ ok: false, error: "startAt must be before endAt" }, { status: 400 });
    }
  } else {
    const baseDate: string | null = booking.event_date || (booking as any).requested_start_date || null;
    if (!baseDate) return NextResponse.json({ ok: false, error: "No base date available; use CUSTOM and pick exact times" }, { status: 400 });
    const d = defaultsFor(baseDate, blockType);
    startISO = d.start; endISO = d.end;
  }

  // Optional conflict advisory for same space/time window
  let conflicts: { id: string }[] = [];
  if (spaceId && startISO && endISO) {
    const { data: c } = await sb
      .from("bookings")
      .select("id")
      .eq("space_id", spaceId)
      .neq("id", id)
      .lt("start_at", endISO)
      .gt("end_at", startISO)
      .limit(5);
    conflicts = c ?? [];
  }

  // Set event_date from startAt (keeps the single-day scheduling model)
  const eventDateToSet = (startISO ?? "").slice(0, 10) || booking.event_date;

  const { error: upErr } = await sb
    .from("bookings")
    .update({
      space_id: spaceId,
      block_type: blockType,
      start_at: startISO,
      end_at: endISO,
      event_date: eventDateToSet
    })
    .eq("id", id);
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  const { error: evErr } = await sb
    .from("booking_status_events")
    .insert({
      booking_id: id,
      old_status: booking.status,
      new_status: booking.status,
      note: `Block assigned: ${blockType}${spaceId ? " @space" : ""}${conflicts.length ? " (conflict detected)" : ""}`,
      user_id: auth.userId ?? null
    });
  if (evErr) return NextResponse.json({ ok: false, error: evErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, conflicts: conflicts.length });
}
