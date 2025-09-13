"use client";
import { Calendar, dateFnsLocalizer, Event as RBCEvent } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { visibleRange } from "@/lib/calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date()), getDay, locales });

type FeedRow = {
  id: string;
  kind: "EVENT" | "BOOKING";
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  time_tbd: boolean | null;
};

export function CalendarPublic({ onSelectDate }: { onSelectDate: (d: Date) => void }) {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<RBCEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => visibleRange(date), [date]);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("rpc_public_calendar", {
        p_from: range.from.toISOString(),
        p_to: range.to.toISOString(),
      });
      if (!isCancelled) {
        if (error) { console.error(error); setEvents([]); }
        else {
          const mapped: RBCEvent[] = (data as FeedRow[]).map(row => ({
            title: row.kind === "EVENT" ? row.title : `${row.title}${row.time_tbd ? " (TBD)" : ""}`,
            start: new Date(row.start_at),
            end: new Date(row.end_at),
            allDay: row.all_day,
            resource: row.kind,
          }));
          setEvents(mapped);
        }
        setLoading(false);
      }
    })();
    return () => { isCancelled = true; };
  }, [range.from, range.to]);

  return (
    <div className="border rounded">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month", "agenda"]}
        onNavigate={(d) => setDate(d)}
        selectable
        onSelectSlot={(slot) => onSelectDate(slot.start as Date)}
        style={{ height: 600 }}
      />
      {loading && <div className="p-2 text-sm text-slate-500">Loading…</div>}
    </div>
  );
}
