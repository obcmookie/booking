"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type MembershipStatus = "LIFE_MEMBER" | "TRUSTEE" | "NON_MEMBER";

interface BookingRow {
  id: string;
  event_type: string | null;
  requested_start_date: string | null;
  requested_end_date: string | null;
  event_date: string | null;
  customer_name: string | null;
  membership_status: MembershipStatus | null;
  status: string | null;
  created_at: string | null;
}

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState<string>("");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const url = q ? `/api/admin/bookings?q=${encodeURIComponent(q)}` : "/api/admin/bookings";
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as { bookings: BookingRow[] };
      setRows(data.bookings);
    }
    setLoading(false);
  }, [q]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const visible = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Bookings</h1>

      <div className="flex items-center gap-2">
        <input
          className="border rounded px-3 py-2 w-80"
          placeholder="Search name / event / status…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void fetchRows()}
        />
        <button className="border rounded px-3 py-2" onClick={() => void fetchRows()}>
          Search
        </button>
      </div>

      {loading ? (
        <div className="p-2">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Dates</th>
                <th className="py-2 pr-3">Event</th>
                <th className="py-2 pr-3">Booker</th>
                <th className="py-2 pr-3">Membership</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Open</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => {
                const start = b.requested_start_date ?? b.event_date ?? "";
                const end = b.requested_end_date ?? b.event_date ?? "";
                const dateRange = start && end ? (start === end ? start : `${start} – ${end}`) : "";
                const membership =
                  b.membership_status === "LIFE_MEMBER"
                    ? "Life Member"
                    : b.membership_status === "TRUSTEE"
                    ? "Trustee"
                    : b.membership_status === "NON_MEMBER"
                    ? "Non Member"
                    : "";

                return (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{dateRange}</td>
                    <td className="py-2 pr-3">{b.event_type ?? ""}</td>
                    <td className="py-2 pr-3">{b.customer_name ?? ""}</td>
                    <td className="py-2 pr-3">{membership}</td>
                    <td className="py-2 pr-3">{b.status ?? ""}</td>
                    <td className="py-2 pr-3">{b.created_at?.slice(0, 10) ?? ""}</td>
                    <td className="py-2 pr-3">
                      <Link className="underline" href={`/admin/bookings/${b.id}/intake`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
                  }
