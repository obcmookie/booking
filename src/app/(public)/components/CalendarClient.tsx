"use client";

import { addMonths, addYears, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths, subYears } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { InquiryInputSchema } from "@/modules/booking/schemas";

type FeedEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  category: string | null;
};

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; bookingId: string; token: string }
  | { status: "error"; message: string };

const EVENT_TYPES = ["Wedding", "Baby Shower", "Katha", "Convention", "Other"] as const;

function toISODate(d: Date) {
  const year = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${m}-${day}`;
}

export default function CalendarClient() {
  const [cursor, setCursor] = useState(startOfMonth(new Date())); // month being viewed
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    description: "",
  });
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build calendar grid range (start of week before 1st, through end of week after last day)
  const range = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return { start, end, days };
  }, [cursor]);

  // Load events for visible range
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/feed.json?start=${range.start.toISOString()}&end=${range.end.toISOString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load events");
        setEvents(json.events as FeedEvent[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range.start, range.end]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, FeedEvent[]>();
    for (const ev of events) {
      const start = new Date(ev.startAt);
      const key = toISODate(start);
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    // Sort by start time within the day
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
      map.set(k, list);
    }
    return map;
  }, [events]);

  function openModalForDate(day: Date) {
    setPickedDate(day);
    setForm((prev) => ({ ...prev, eventDate: toISODate(day), eventType: prev.eventType || EVENT_TYPES[0] }));
    setErrors({});
    setState({ status: "idle" });
    setShowModal(true);
  }

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setState({ status: "submitting" });
    try {
      InquiryInputSchema.parse(form);
    } catch (err: unknown) {
      // lightweight zod error extraction
      const zerrors: Record<string, string> = {};
      const anyErr = err as { issues?: Array<{ path: (string | number)[]; message: string }> };
      anyErr.issues?.forEach((i) => {
        if (typeof i.path?.[0] === "string") zerrors[i.path[0] as string] = i.message;
      });
      setErrors(zerrors);
      setState({ status: "idle" });
      return;
    }

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json: { ok: boolean; bookingId?: string; token?: string; error?: string } = await res.json();
      if (!res.ok || !json.ok || !json.bookingId || !json.token) throw new Error(json.error || "Failed to submit");
      setState({ status: "success", bookingId: json.bookingId, token: json.token });
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Failed to submit" });
    }
  }

  const dayClasses = (d: Date) =>
    [
      "relative rounded-lg p-2 cursor-pointer select-none",
      isSameMonth(d, cursor) ? "bg-white hover:bg-slate-50" : "bg-slate-50 text-slate-400 hover:bg-slate-100",
      isToday(d) ? "ring-2 ring-blue-500" : "border border-slate-200",
    ].join(" ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-lg font-semibold text-slate-900">{format(cursor, "MMMM yyyy")}</div>
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50" onClick={() => setCursor(subYears(cursor, 1))}>« Year</button>
          <button className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50" onClick={() => setCursor(subMonths(cursor, 1))}>‹ Month</button>
          <button className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50" onClick={() => setCursor(new Date())}>Today</button>
          <button className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50" onClick={() => setCursor(addMonths(cursor, 1))}>Month ›</button>
          <button className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50" onClick={() => setCursor(addYears(cursor, 1))}>Year »</button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-t border-slate-200 text-center text-xs font-medium text-slate-500">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-2 p-2">
        {range.days.map((d) => {
          const key = toISODate(d);
          const dayEvents = eventsByDay.get(key) ?? [];
          return (
            <div key={key} className={dayClasses(d)} onClick={() => openModalForDate(d)}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${isSameMonth(d, cursor) ? "text-slate-900" : "text-slate-400"}`}>{d.getDate()}</div>
                {isToday(d) && <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">Today</span>}
              </div>
              {/* Events list */}
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className={`truncate rounded-md px-2 py-1 text-xs ${
                      ev.visibility === "PRIVATE" ? "bg-slate-200 text-slate-700" : "bg-blue-100 text-blue-800"
                    }`}
                    title={`${ev.title} (${format(new Date(ev.startAt), "p")} - ${format(new Date(ev.endAt), "p")})`}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] text-slate-500">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && <div className="px-4 pb-4 text-sm text-slate-500">Loading events…</div>}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Request {pickedDate ? format(pickedDate, "MMMM d, yyyy") : "a date"}</h3>
              <button className="rounded-md p-1 text-slate-500 hover:bg-slate-100" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {state.status === "success" ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                Thanks! Your inquiry was submitted.
              </div>
            ) : (
              <form onSubmit={submitInquiry} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full name</label>
                  <input
                    name="name"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <input
                      name="email"
                      type="email"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Phone</label>
                    <input
                      name="phone"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Event type</label>
                    <select
                      name="eventType"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={form.eventType}
                      onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))}
                    >
                      {EVENT_TYPES.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.eventType && <p className="mt-1 text-sm text-red-600">{errors.eventType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Preferred date</label>
                    <input
                      name="eventDate"
                      type="date"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={form.eventDate}
                      onChange={(e) => setForm((p) => ({ ...p, eventDate: e.target.value }))}
                    />
                    {errors.eventDate && <p className="mt-1 text-sm text-red-600">{errors.eventDate}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Details (optional)</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                {state.status === "error" && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={state.status === "submitting"}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 disabled:opacity-60"
                  >
                    {state.status === "submitting" ? "Submitting..." : "Submit request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
