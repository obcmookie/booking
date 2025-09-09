"use client";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/modules/auth/supabaseBrowser";

export default function ResetPasswordPage() {
  const supabase = useMemo(supabaseBrowser, []);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setError(null); setLoading(true);
    const redirectTo = `${window.location.origin}/admin/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMsg("If an account exists for that email, a reset link has been sent.");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Reset Password</h1>
        <p className="text-sm text-gray-600">Enter your admin email and we’ll send a reset link.</p>
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input className="w-full rounded-md border p-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <button className="w-full rounded-md bg-blue-600 text-white py-2 disabled:opacity-50" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
