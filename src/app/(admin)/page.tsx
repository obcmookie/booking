"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/modules/auth/useRequireAuth";


type BookingRow = {
id: string;
created_at: string;
customer_name: string;
event_date: string;
status: string;
};


export default function AdminHome() {
const { user, loading, supabase } = useRequireAuth();
const [rows, setRows] = useState<BookingRow[]>([]);
const [err, setErr] = useState<string | null>(null);


useEffect(() => {
if (!user) return;
(async () => {
const { data, error } = await supabase
.from("bookings")
.select("id, created_at, customer_name, event_date, status")
.order("created_at", { ascending: false })
.limit(25);
if (error) setErr(error.message);
else setRows(data ?? []);
})();
}, [user, supabase]);


if (loading) return <div className="p-6">Loading…</div>;
if (!user) return null;

return (
<div className="p-6 space-y-6">
<div className="flex items-center justify-between">
<h1 className="text-2xl font-semibold">Admin Inbox</h1>
<div className="flex gap-3">
<Link className="px-3 py-2 rounded-md bg-gray-100" href="/admin/users">Manage Users</Link>
<button className="px-3 py-2 rounded-md bg-gray-100" onClick={() => supabase.auth.signOut().then(()=>location.href="/admin/login")}>Sign out</button>
</div>
</div>
{err && <p className="text-red-600">{err}</p>}
<div className="rounded-xl overflow-hidden border">
<table className="w-full text-sm">
<thead className="bg-gray-50 text-left">
<tr>
<th className="p-3">When</th>
<th className="p-3">Customer</th>
<th className="p-3">Date</th>
<th className="p-3">Status</th>
<th className="p-3">View</th>
</tr>
</thead>
<tbody>
{rows.map(r => (
<tr key={r.id} className="border-t">
<td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
<td className="p-3">{r.customer_name}</td>
<td className="p-3">{r.event_date}</td>
<td className="p-3">{r.status}</td>
<td className="p-3">
<a className="text-blue-600 hover:underline" href={`/admin/bookings/${r.id}`}>Open</a>
</td>
</tr>
))}
{rows.length === 0 && (
<tr><td className="p-4 text-gray-500" colSpan={5}>No recent inquiries.</td></tr>
)}
</tbody>
</table>
</div>
</div>
);
}