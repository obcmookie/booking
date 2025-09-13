"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CalendarPublic } from "@/components/CalendarPublic";
import { InquiryModal } from "@/components/InquiryModal";
import { AuthModal } from "@/components/AuthModal";

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [inqOpen, setInqOpen] = useState(false);
  const [inqDate, setInqDate] = useState<Date | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-semibold text-xl">Temple Calendar</h1>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <a href="/dashboard" className="text-sm underline">Dashboard</a>
              <button className="text-sm underline" onClick={() => supabase.auth.signOut()}>Sign out</button>
            </>
          ) : (
            <button className="text-sm underline" onClick={() => setAuthOpen(true)}>Sign in</button>
          )}
        </div>
      </header>

      <CalendarPublic onSelectDate={(d) => { setInqDate(d); setInqOpen(true); }} />

      <div>
        <button className="mt-4 px-3 py-2 rounded bg-slate-900 text-white" onClick={() => { setInqDate(null); setInqOpen(true); }}>
          New Inquiry
        </button>
      </div>

      <InquiryModal open={inqOpen} onClose={() => setInqOpen(false)} defaultStart={inqDate || undefined} defaultEnd={inqDate || undefined} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </main>
  );
}
