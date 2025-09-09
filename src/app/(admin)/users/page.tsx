"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/modules/auth/useRequireAuth";
import { supabaseBrowser } from "@/modules/auth/supabaseBrowser";


type UserRow = {
id: string;
email: string | null;
created_at: string | null;
last_sign_in_at: string | null;
roles: string[];
};


const ROLES = ["committee","management","kitchen","finance","admin"] as const;
type Role = typeof ROLES[number];


async function getToken() {
const sb = supabaseBrowser();
const { data } = await sb.auth.getSession();
return data.session?.access_token;
}

export default function UsersPage() {
const { user, loading } = useRequireAuth();
const [rows, setRows] = useState<UserRow[]>([]);
const [err, setErr] = useState<string | null>(null);
const [busy, setBusy] = useState(false);


// create form
const [newEmail, setNewEmail] = useState("");
const [newPassword, setNewPassword] = useState("");
const [newRole, setNewRole] = useState<Role>("committee");


const fetchUsers = async () => {
setErr(null);
const token = await getToken();
const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` }});
const json = await res.json();
if (!json.ok) { setErr(json.error || "Failed to load"); return; }
setRows(json.users);
};

useEffect(() => { if (user) fetchUsers(); }, [user]);


const createUser = async () => {
setBusy(true); setErr(null);
const token = await getToken();
const res = await fetch("/api/admin/users", {
method: "POST",
headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
});
const json = await res.json();
setBusy(false);
if (!json.ok) { setErr(json.error || "Failed to create user"); return; }
setNewEmail(""); setNewPassword(""); setNewRole("committee");
fetchUsers();
};


const updateUser = async (id: string, changes: Partial<{email: string; password: string; role: Role}>) => {
setBusy(true); setErr(null);
const token = await getToken();
const res = await fetch(`/api/admin/users/${id}`, {
method: "PATCH",
headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
body: JSON.stringify(changes)
});
const json = await res.json();
setBusy(false);
if (!json.ok) { setErr(json.error || "Failed to update user"); return; }
fetchUsers();
};

const deleteUser = async (id: string) => {
if (!confirm("Delete this user? This cannot be undone.")) return;
setBusy(true); setErr(null);
const token = await getToken();
const res = await fetch(`/api/admin/users/${id}`, {
method: "DELETE",
headers: { Authorization: `Bearer ${token}` }
});
const json = await res.json();
setBusy(false);
if (!json.ok) { setErr(json.error || "Failed to delete user"); return; }
fetchUsers();
};


if (loading) return <div className="p-6">Loading…</div>;
if (!user) return null;


return (
<div className="p-6 space-y-6">
<div className="flex items-center justify-between">
<h1 className="text-2xl font-semibold">Users</h1>
<a className="px-3 py-2 rounded-md bg-gray-100" href="/admin">Back to Admin</a>
</div>


{err && <p className="text-red-600">{err}</p>}

<div className="rounded-xl border p-4 space-y-3">
<h2 className="font-semibold">Create New User</h2>
<div className="grid sm:grid-cols-4 gap-3">
<input className="rounded-md border p-2" placeholder="email@example.com" value={newEmail} onChange={e=>setNewEmail(e.target.value)} />
<input className="rounded-md border p-2" placeholder="Initial password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
<select className="rounded-md border p-2" value={newRole} onChange={e=>setNewRole(e.target.value as Role)}>
{ROLES.map(r => <option key={r} value={r}>{r}</option>)}
</select>
<button className="rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-50" onClick={createUser} disabled={busy || !newEmail || !newPassword}>
{busy ? "Working…" : "Create"}
</button>
</div>
<p className="text-xs text-gray-500">Email is auto-confirmed. Roles map to your RLS policies.</p>
</div>


<div className="rounded-xl overflow-hidden border">
<table className="w-full text-sm">
<thead className="bg-gray-50 text-left">
<tr>
<th className="p-3">Email</th>
<th className="p-3">Roles</th>
<th className="p-3">Last Sign-in</th>
<th className="p-3">Actions</th>
</tr>
</thead>
<tbody>
{rows.map(u => (
<UserRowView key={u.id} row={u} onUpdate={updateUser} onDelete={deleteUser} busy={busy} />
))}
{rows.length === 0 && <tr><td className="p-4 text-gray-500" colSpan={4}>No users found.</td></tr>}
</tbody>
</table>
</div>
</div>
);
}

function UserRowView({ row, busy, onUpdate, onDelete }: {
row: UserRow;
busy: boolean;
onUpdate: (id: string, changes: any) => void;
onDelete: (id: string) => void;
}) {
const [role, setRole] = useState<Role | "">(row.roles[0] as Role | "");


const [newPass, setNewPass] = useState("");
const [newEmail, setNewEmail] = useState(row.email ?? "");


return (
<tr className="border-t">
<td className="p-3">{row.email}</td>
<td className="p-3">
<select className="rounded-md border p-1" value={role} onChange={e=>setRole(e.target.value as Role)}>
<option value="">(none)</option>
{ROLES.map(r => <option key={r} value={r}>{r}</option>)}
</select>
</td>
<td className="p-3">{row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleString() : "—"}</td>
<td className="p-3 flex flex-col gap-2 sm:flex-row">
<input className="rounded-md border p-1" placeholder="new email (optional)" value={newEmail} onChange={e=>setNewEmail(e.target.value)} />
<input className="rounded-md border p-1" placeholder="new password (optional)" value={newPass} onChange={e=>setNewPass(e.target.value)} />
<button className="rounded-md bg-blue-600 text-white px-3 py-1 disabled:opacity-50" disabled={busy} onClick={()=>onUpdate(row.id, { email: newEmail || undefined, password: newPass || undefined, role: role || undefined })}>
Save
</button>
<button className="rounded-md bg-red-600 text-white px-3 py-1 disabled:opacity-50" disabled={busy} onClick={()=>onDelete(row.id)}>
Delete
</button>
</td>
</tr>
);
}