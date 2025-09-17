"use client";
import { useEffect, useState } from "react";
import type { AppSettingRow } from "@/components/types";


interface KV {
key: string;
value: Record<string, unknown>;
}


export default function SettingsPage() {
const [rows, setRows] = useState<AppSettingRow[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [saving, setSaving] = useState<boolean>(false);


useEffect(() => {
(async () => {
const res = await fetch("/api/admin/settings");
if (res.ok) {
const data = (await res.json()) as { ok: boolean; settings: AppSettingRow[] };
setRows(data.settings);
}
setLoading(false);
})();
}, []);


const get = (key: string, field: string) => {
const row = rows.find(r => r.key === key);
const obj = row?.value as Record<string, unknown> | undefined;
return (obj?.[field] ?? "") as string | number | boolean;
};


const set = (key: string, field: string, val: string | number | boolean) => {
setRows(prev => prev.map(r => r.key === key ? { ...r, value: { ...(r.value ?? {}), [field]: val } } : r));
};


const save = async () => {
setSaving(true);
const kv: KV[] = rows.map(r => ({ key: r.key, value: r.value ?? {} }));
const res = await fetch("/api/admin/settings", {
method: "POST",
headers: { "content-type": "application/json" },
body: JSON.stringify({ settings: kv }),
});
setSaving(false);
if (!res.ok) alert("Save failed");
};


if (loading) return <div className="p-2">Loading…</div>;


return (
<div className="p-4 space-y-6 max-w-3xl">
<h1 className="text-2xl font-semibold">Settings</h1>


<section className="space-y-2">
<h2 className="font-medium">Organization</h2>
<label className="block text-sm">Name</label>
<input className="border rounded px-2 py-1 w-full" value={String(get("org_name","text")||"")} onChange={e=>set("org_name","text",e.target.value)} />
<label className="block text-sm mt-2">Timezone (IANA)</label>
<input className="border rounded px-2 py-1 w-full" value={String(get("org_timezone","text")||"")} onChange={e=>set("org_timezone","text",e.target.value)} />
</section>


<section className="space-y-2">
<h2 className="font-medium">Proposals & Deadlines</h2>
<label className="block text-sm">Menu lock days (default)</label>
<input type="number" className="border rounded px-2 py-1 w-40" value={Number(get("menu_lock_days_default","number")||0)} onChange={e=>set("menu_lock_days_default","number", Number(e.target.value||0))} />
<label className="block text-sm mt-2">Balance due days before event</label>
<input type="number" className="border rounded px-2 py-1 w-40" value={Number(get("balance_due_days_before_event","number")||0)} onChange={e=>set("balance_due_days_before_event","number", Number(e.target.value||0))} />
</section>


<section className="space-y-2">
<h2 className="font-medium">Proposal Terms (Markdown)</h2>
<textarea className="border rounded px-2 py-1 w-full h-56" value={String(get("proposal_terms_md","text")||"")} onChange={e=>set("proposal_terms_md","text", e.target.value)} />
</section>


<div className="flex gap-2">
<button onClick={save} disabled={saving} className="border rounded px-4 py-2">Save</button>
</div>
</div>
);
}