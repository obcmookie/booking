"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Role = "admin" | "kitchen";
type U = { id: string; email?: string | null; created_at?: string | null; last_sign_in_at?: string | null; };
type RoleRow = { user_id: string; role: Role };

type ListResponse = { users: U[]; roles: RoleRow[] } | { error: string };

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("kitchen");
  const [loading, setLoading] = useState(true);

  const authHeader = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const headers = await authHeader();
    const res = await fetch("/api/admin/users", { headers });
    const json: ListResponse = await res.json();
    if (res.ok && "users" in json) {
      setUsers(json.users || []);
      setRoles(json.roles || []);
    } else {
      alert(("error" in json && json.error) || "Failed to load users");
    }
    setLoading(false);
  }, [authHeader]);

  useEffect(() => { void load(); }, [load]);

  const createUser = useCallback(async () => {
    const headers = await authHeader();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ email, password: password || undefined, role }),
    });
    const json: { user?: U; error?: string } = await res.json();
    if (!res.ok) { alert(json.error || "Create failed"); return; }
    setEmail(""); setPassword("");
    await load();
  }, [authHeader, email, password, role, load]);

  const updateRole = useCallback(async (id: string, newRole: Role) => {
    const headers = await authHeader();
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ role: newRole }),
    });
    const json: { ok?: boolean; error?: string } = await res.json();
    if (!res.ok) { alert(json.error || "Update failed"); return; }
    await load();
  }, [authHeader, load]);

  const deleteUser = useCallback(async (id: string) => {
    if (!confirm("Delete this user?")) return;
    const headers = await authHeader();
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers });
    const json: { ok?: boolean; error?: string } = await res.json();
    if (!res.ok) { alert(json.error || "Delete failed"); return; }
    await load();
  }, [authHeader, load]);

  const roleOf = useCallback((id: string): Role => {
    const r = roles.find(rr => rr.user_id === id)?.role;
    return (r === "admin" || r === "kitchen") ? r : "kitchen";
  }, [roles]);

  return (
    <main className="max-w-5xl mx-auto p-4">
      <header className="flex items-center justify-between mb-3">
        <h1 className="font-semibold text-xl">Users</h1>
        <nav className="flex gap-3 text-sm">
          <Link className="underline" href="/dashboard">Dashboard</Link>
          <Link className="underline" href="/">Public</Link>
        </nav>
      </header>

      <section className="border rounded p-3 mb-4">
        <h2 className="font-medium mb-2">Create user</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border rounded p-2" placeholder="Email"
                 value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="border rounded p-2" placeholder="Temp password (optional)"
                 value={password} onChange={(e)=>setPassword(e.target.value)} />
          <select className="border rounded p-2" value={role}
                  onChange={(e)=>setRole((e.target.value as Role) || "kitchen")}>
            <option value="kitchen">kitchen (read-only)</option>
            <option value="admin">admin (full access)</option>
          </select>
          <button className="rounded bg-slate-900 text-white p-2" onClick={createUser}>Create</button>
        </div>
      </section>

      <section className="border rounded">
        {loading ? <p className="p-3">Loading…</p> : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Last sign-in</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr className="border-t" key={u.id}>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.created_at ? new Date(u.created_at).toLocaleString() : "-"}</td>
                  <td className="p-2">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "-"}</td>
                  <td className="p-2">
                    <select className="border rounded p-1" value={roleOf(u.id)}
                            onChange={(e)=>updateRole(u.id, (e.target.value as Role) || "kitchen")}>
                      <option value="kitchen">kitchen</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button className="text-red-600 underline" onClick={()=>deleteUser(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td className="p-4 text-center text-slate-500" colSpan={5}>No users.</td></tr>}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
