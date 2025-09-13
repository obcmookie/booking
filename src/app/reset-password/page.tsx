"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setErr(error.message);
    else { setOk(true); }
  };

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="font-semibold text-xl mb-3">Set new password</h1>
      {ok ? (
        <div className="space-y-2">
          <p className="text-green-700">Password updated. You can now go to the dashboard.</p>
          <Link href="/dashboard" className="underline">Go to dashboard</Link>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="password"
            className="w-full border rounded p-2"
            placeholder="New password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button onClick={submit} className="px-3 py-2 rounded bg-slate-900 text-white">Update password</button>
        </div>
      )}
    </main>
  );
}
