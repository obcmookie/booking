"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type U = { id: string; email?: string | null; created_at?: string | null; last_sign_in_at?: string | null; };
type RoleRow = { user_id: string; role: "admin" | "kitchen" };

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin"|"kitchen">("kitchen");
  const [loading, setLoading] = useState(true);

  const authHeader = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return { Authorization: `Bearer ${token}` };
  };

  const load = async () => {
    setLoading(true);
    const headers = await authHeader();
    const res = await fetch("/api/admin/users", { headers });
    const json = await res.json();
    if (res.ok) { setUsers(json.users || []); setRoles(json.roles || []); }
    else alert(json.error);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createUser = async () => {
    const headers = await authHeader();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ email, password: password || undefined, role }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error);
    setEmail(""); setPassword("");
    await load();
  };

  const updateRole = async (id: string, role: "admin"|"kitchen") => {
    const headers = await authHeader();
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error);
    await load();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    const headers = await authHeader();
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers });
    const json = await res.json();
    if (!res.ok) return alert(json.error);
    await load();
  };

  const roleOf = (id: string) => roles.find(r => r.user_id === id)?.role || "kitchen";

  return (
    <main className="max-w-5xl mx-auto p-4">
      <header className="flex items-center justify-between mb-3">
        <h1 className="font-semibold text-xl">Users</h1>
        <nav className="flex gap-3 text-sm">
          <a className="underline" href="/dashboard">Dashboard</a>
          <a className="underline" href="/">Public</a>
        </nav>
      </header>

      <section className="border rounded p-3 mb-4">
        <h2 className="font-medium mb-2">Create user</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border rounded p-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="border rounded p-2" placeholder="Temp password (optional)" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <select className="border rounded p-2" value={role} onChange={(e)=>setRole(e.target.value as any)}>
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
                    <select className="border rounded p-1" value={roleOf(u.id)} onChange={(e)=>updateRole(u.id, e.target.value as any)}>
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
