"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function AuthModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message); else onClose();
  };

  const sendReset = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message); else alert("Reset link sent (check your email).");
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-sm rounded bg-white p-4 shadow">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Sign in</h2>
          <button onClick={onClose} className="text-sm text-slate-500">✕</button>
        </div>
        <div className="space-y-2">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"
            className="w-full border rounded p-2" type="email"/>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"
            className="w-full border rounded p-2" type="password"/>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={signIn} disabled={loading}
            className="w-full rounded bg-slate-900 text-white p-2">{loading ? "Signing in..." : "Sign in"}</button>
          <button onClick={sendReset} className="w-full text-sm text-slate-600 underline">Forgot password?</button>
        </div>
      </div>
    </div>
  );
}
