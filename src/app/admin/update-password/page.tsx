"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/modules/auth/supabaseBrowser";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const qp = useSearchParams();
  const supabase = useMemo(supabaseBrowser, []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"verifying" | "ready" | "error">("verifying");

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("error=")) {
      const params = new URLSearchParams(hash.slice(1));
      const desc = params.get("error_description") || "Reset link invalid or expired.";
      setError(desc.replaceAll("+", " "));
      setStatus("error");
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStatus("ready");
      }
    });

    (async () => {
      try {
        const code = qp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const probe = async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setStatus("ready");
          } else {
            setStatus("error");
            setError("Reset link expired or invalid. Request a new one.");
          }
        };
        setTimeout(probe, 150);
      } catch (e: any) {
        setStatus("error");
        setError(e?.message || "Could not validate reset link.");
      }
    })();

    return () => sub?.subscription?.unsubscribe();
  }, [supabase, qp]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return setError(error.message);
    router.replace("/admin/login?reset=success");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Set a new password</h1>
        {status === "verifying" && <p className="text-sm text-gray-600">Validating reset link…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="space-y-1">
          <label className="text-sm">New password</label>
          <input className="w-full rounded-md border p-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Confirm password</label>
          <input className="w-full rounded-md border p-2" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        </div>
        <button className="w-full rounded-md bg-blue-600 text-white py-2 disabled:opacity-50"
                disabled={saving || status!=="ready"}>
          {saving ? "Saving…" : "Update password"}
        </button>
        <p className="text-xs text-gray-500">If you keep seeing “expired”, request a fresh link from <a className="text-blue-600 underline" href="/admin/reset-password">Reset Password</a>.</p>
      </form>
    </div>
  );
}
