"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensures Supabase processes any access_token in the URL hash
    void supabase.auth.getSession();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }
    setOk(true);
    setLoading(false);
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-3 text-xl font-semibold">Set new password</h1>
      {ok ? (
        <div className="space-y-2">
          <p className="text-green-700">Password updated. You can now go to the dashboard.</p>
          <Link href="/dashboard" className="underline">
            Go to dashboard
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <input
            type="password"
            className="w-full rounded border p-2"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            type="submit"
            disabled={loading || password.length < 8}
            className="rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </main>
  );
}
