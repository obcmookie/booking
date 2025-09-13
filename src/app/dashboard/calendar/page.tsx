"use client";
import { CalendarPublic } from "@/components/CalendarPublic";
import { useState } from "react";
import { InquiryModal } from "@/components/InquiryModal";
import Link from "next/link";

export default function StaffCalendar() {
  const [inqOpen, setInqOpen] = useState(false);
  const [inqDate, setInqDate] = useState<Date | null>(null);

  return (
    <main className="max-w-6xl mx-auto p-4">
      <header className="flex items-center justify-between mb-3">
        <h1 className="font-semibold text-xl">Staff Calendar</h1>
        <nav className="flex gap-3 text-sm">
          <Link className="underline" href="/dashboard">All Bookings</Link>
          <Link className="underline" href="/admin/users">Users</Link>
        </nav>
      </header>

      <CalendarPublic onSelectDate={(d)=>{ setInqDate(d); setInqOpen(true); }} />
      <InquiryModal open={inqOpen} onClose={()=>setInqOpen(false)}
                    defaultStart={inqDate || undefined} defaultEnd={inqDate || undefined} />
    </main>
  );
}
