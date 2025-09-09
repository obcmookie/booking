"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/modules/auth/supabaseBrowser";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = useMemo(supabaseBrowser, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.replace("/admin");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input className="w-full rounded-md border p-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input className="w-full rounded-md border p-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-md bg-blue-600 text-white py-2 disabled:opacity-50" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="text-sm text-center">
          <a href="/admin/reset-password" className="text-blue-600 hover:underline">Forgot password?</a>
        </div>
      </form>
    </div>
  );
}
