import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="p-4">
      <nav className="mb-4 flex gap-2 flex-wrap">
        <Link className="border rounded px-3 py-1.5" href="/admin/bookings">Bookings</Link>
        <Link className="border rounded px-3 py-1.5" href="/admin/services">Services</Link>
        <Link className="border rounded px-3 py-1.5" href="/admin/menu">Food Menu</Link>
        <Link className="border rounded px-3 py-1.5" href="/admin/settings">Settings</Link>
      </nav>
      {children}
    </div>
  );
}
