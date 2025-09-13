"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type U = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
};

type Role = "admin" | "kitchen";

type RoleRow = { user_id: string; role: Role };

type UsersResponse = {
  users?: U[];
  roles?: RoleRow[];
  error?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("kitchen");
  const [loading, setLoading] = useState(true);

  const authHeader = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";
    return { Authorization: `Bearer ${token}` };
  };

  const load = useCallback(async () => {
    setLoading(true);
    const headers = await authHeader();
    const res = await fetch("/api/admin/users", { headers });
    const json = (await res.json()) as UsersResponse;
    if (res.ok) {
      setUsers(json.users ?? []);
      setRoles(json.roles ?? []);
    } else {
      alert(json.error ?? "Failed to load users");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createUser = async () => {
    const headers = await authHeader();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        email,
        password: password || undefined,
        role,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) return alert(json.error ?? "Failed to create user");
    setEmail("");
    setPassword("");
    await load();
  };

  const updateRole = async (id: string, newRole: Role) => {
    const headers = await authHeader();
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ role: newRole }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) return alert(json.error ?? "Failed to update role");
    await load();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    const headers = await authHeader();
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) return alert(json.error ?? "Failed to delete user");
    await load();
  };

  const roleOf = (id: string): Role => roles.find((r) => r.user_id === id)?.role ?? "kitchen";

  return (
    <main className="mx-auto max-w-5xl p-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <nav className="flex gap-3 text-sm">
          <Link className="underline" href="/dashboard">
            Dashboard
          </Link>
          <Link className="underline" href="/">
            Public
          </Link>
        </nav>
      </header>

      <section className="mb-4 rounded border p-3">
        <h2 className="mb-2 font-medium">Create user</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input
            className="rounded border p-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded border p-2"
            placeholder="Temp password (optional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            className="rounded border p-2"
            value={role}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setRole(e.target.value as Role)
            }
          >
            <option value="kitchen">kitchen (read-only)</option>
            <option value="admin">admin (full access)</option>
          </select>
          <button className="rounded bg-slate-900 p-2 text-white" onClick={createUser}>
            Create
          </button>
        </div>
      </section>

      <section className="rounded border">
        {loading ? (
          <p className="p-3">Loading…</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Last sign-in</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr className="border-t" key={u.id}>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : "-"}
                  </td>
                  <td className="p-2">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "-"}
                  </td>
                  <td className="p-2">
                    <select
                      className="rounded border p-1"
                      value={roleOf(u.id)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        updateRole(u.id, e.target.value as Role)
                      }
                    >
                      <option value="kitchen">kitchen</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      className="underline text-red-600"
                      onClick={() => deleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={5}>
                    No users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
