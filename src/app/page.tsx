// src/app/page.tsx
'use client';

import LoginModal from '@/components/LoginModal';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
        <p className="text-sm text-gray-600">
          A leaner version of Perfect Venue for intake → proposals → menus → kitchen.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/inquire" className="rounded-xl bg-black px-4 py-2 text-white">Public Inquiry</Link>
          <LoginModal />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/pipeline" className="rounded-xl border px-4 py-2 hover:bg-gray-50">Admin Pipeline</Link>
          <Link href="/kitchen/today" className="rounded-xl border px-4 py-2 hover:bg-gray-50">Kitchen: Today</Link>
        </div>
      </section>
    </div>
  );
}
