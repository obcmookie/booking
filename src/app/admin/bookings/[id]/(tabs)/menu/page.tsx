"use client";
method: "PATCH",
headers: { "content-type": "application/json" },
body: JSON.stringify({ menu_template_id: templateId }),
});
if (res.ok) await fetchInfo();
setSaving(false);
};


if (loading || !info) return <div className="p-2">Loading…</div>;


return (
<div className="space-y-4">
<div className="flex items-center justify-between">
<div>
<div className="text-sm text-gray-600">Event</div>
<div className="font-medium">{info.event_type}</div>
<div className="text-sm text-gray-600">Dates</div>
<div>{info.date_start === info.date_end ? info.date_start : `${info.date_start} – ${info.date_end}`}</div>
</div>
<div className="flex gap-2">
<button onClick={openMenu} disabled={saving} className="border rounded px-3 py-1.5">Open Menu</button>
<button onClick={lockMenu} disabled={saving} className="border rounded px-3 py-1.5">Lock Menu</button>
</div>
</div>


<div className="flex items-center gap-3">
<label className="text-sm">Template</label>
<select
className="border rounded px-2 py-1"
value={info.menu_template_id ?? ""}
onChange={(e) => setTemplate(e.target.value || null)}
>
<option value="">(All active items)</option>
{info.templates.map(t => (
<option key={t.id} value={t.id}>{t.name}</option>
))}
</select>
</div>


<div className="rounded border p-3">
<div className="font-medium mb-2">Public Link</div>
{menuLink ? (
<div className="flex items-center gap-3 text-sm">
<code className="px-2 py-1 bg-gray-50 border rounded break-all">{menuLink}</code>
<Link target="_blank" href={menuLink} className="underline">Open</Link>
</div>
) : (
<div className="text-sm text-gray-600">Menu is not open yet. Click “Open Menu”.</div>
)}
</div>


<div>
<div className="font-medium mb-2">Current Selections</div>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="text-left border-b">
<th className="py-1 pr-2">Category</th>
<th className="py-1 pr-2">Item</th>
<th className="py-1 pr-2">Meal</th>
<th className="py-1 pr-2">Qty</th>
<th className="py-1 pr-2">Instructions</th>
</tr>
</thead>
<tbody>
{info.selections.map((s, idx) => (
<tr key={`${s.item_id}-${idx}`} className="border-b last:border-0">
<td className="py-1 pr-2">{s.category_name}</td>
<td className="py-1 pr-2">{s.item_name}</td>
<td className="py-1 pr-2">{s.session ?? ""}</td>
<td className="py-1 pr-2">{s.qty}</td>
<td className="py-1 pr-2">{s.instructions ?? ""}</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
</div>
);
}