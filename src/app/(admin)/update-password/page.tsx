"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/modules/auth/supabaseBrowser";


export default function UpdatePasswordPage() {
const router = useRouter();
const supabase = useMemo(supabaseBrowser, []);
const [password, setPassword] = useState("");
const [confirm, setConfirm] = useState("");
const [msg, setMsg] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
const [ready, setReady] = useState(false);
const [saving, setSaving] = useState(false);

useEffect(() => {
// When opened from email, Supabase sets a temporary session.
// We can proceed to update the password directly.
supabase.auth.getSession().then(({ data }) => {
setReady(!!data.session);
if (!data.session) setError("Reset link expired or invalid. Request a new one.");
});
}, [supabase]);


const onSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setError(null); setMsg(null);
if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
if (password !== confirm) { setError("Passwords do not match."); return; }
setSaving(true);
const { error } = await supabase.auth.updateUser({ password });
setSaving(false);
if (error) { setError(error.message); return; }
setMsg("Password updated. You can now sign in.");
// Clear the temp session
await supabase.auth.signOut();
router.replace("/admin/login");
};

return (
<div className="min-h-[70vh] flex items-center justify-center p-4">
<form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
<h1 className="text-xl font-semibold">Set a new password</h1>
{!ready && !error && <p className="text-sm text-gray-600">Validating reset link…</p>}
<div className="space-y-1">
<label className="text-sm">New password</label>
<input className="w-full rounded-md border p-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
</div>
<div className="space-y-1">
<label className="text-sm">Confirm password</label>
<input className="w-full rounded-md border p-2" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
</div>
{error && <p className="text-sm text-red-600">{error}</p>}
{msg && <p className="text-sm text-green-700">{msg}</p>}
<button className="w-full rounded-md bg-blue-600 text-white py-2 disabled:opacity-50" disabled={saving || !ready}>
{saving ? "Saving…" : "Update password"}
</button>
</form>
</div>
);
}