import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";

type EventRow = {
  id: string;
  title: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  start_at: string;
  end_at: string;
  all_day: boolean;
  publish_at: string | null;
  category: string | null;
};

type FeedEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  category: string | null;
};

function isoOrDefault(s?: string | null, fallback?: string): string | undefined {
  if (!s && fallback) return fallback;
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? fallback : d.toISOString();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const start = isoOrDefault(url.searchParams.get("start"));
    const end = isoOrDefault(url.searchParams.get("end"));
    if (!start || !end) {
      return NextResponse.json({ ok: false, error: "start and end (ISO) are required" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("events")
      .select("id,title,visibility,status,start_at,end_at,all_day,publish_at,category")
      .neq("status", "CANCELLED")
      .gt("end_at", start)
      .lt("start_at", end);

    if (error) throw error;

    const rows = (data ?? []) as EventRow[];
    const now = Date.now();

    const feed: FeedEvent[] = rows.flatMap((e): FeedEvent[] => {
      const isPubliclyVisible =
        e.visibility === "PUBLIC" &&
        e.status === "PUBLISHED" &&
        (!e.publish_at || new Date(e.publish_at).getTime() <= now);

      if (isPubliclyVisible) {
        return [
          {
            id: e.id,
            title: e.title ?? "Event",
            startAt: e.start_at,
            endAt: e.end_at,
            allDay: e.all_day,
            visibility: "PUBLIC",
            category: e.category,
          } as FeedEvent,
        ];
      }

      if (e.visibility === "PRIVATE" && e.status !== "CANCELLED") {
        return [
          {
            id: e.id,
            title: "Private Event (Booked)",
            startAt: e.start_at,
            endAt: e.end_at,
            allDay: e.all_day,
            visibility: "PRIVATE",
            category: "private",
          } as FeedEvent,
        ];
      }

      return [];
    });

    return NextResponse.json({ ok: true, events: feed }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load events";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
