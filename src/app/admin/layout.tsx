"use client";
import Link from "next/link";
import { useRequireAuth } from "@/modules/auth/useRequireAuth";
import { useMyRoles } from "@/modules/auth/useMyRoles";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, supabase } = useRequireAuth("/admin/login");
  const roles = useMyRoles(user);

  if (loading || roles === undefined) return <div className="p-6">Loading…</div>;
  if (!user) return null;

  const isAdmin = roles?.includes("admin");
  const isKitchen = roles?.includes("kitchen");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">Booking Admin</Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              {isAdmin && <Link href="/admin" className="hover:underline">Inbox</Link>}
              {(isKitchen || isAdmin) && <Link href="/admin/kitchen" className="hover:underline">Kitchen</Link>}
              {isAdmin && <Link href="/admin/users" className="hover:underline">Users</Link>}
              {isAdmin && <span className="text-gray-400">Settings</span>}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              className="text-sm px-3 py-1 rounded-md bg-gray-100"
              onClick={() => supabase.auth.signOut().then(() => (location.href = "/admin/login"))}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
