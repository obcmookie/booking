"use client";
});
if (!res.ok) alert("Save failed");
else alert(submit ? "Submitted!" : "Saved");
};


if (loading) return <div className="p-6">Loading menu…</div>;


const title = rows[0] ? `${rows[0].event_type} — ${rows[0].start_date === rows[0].end_date ? rows[0].start_date : `${rows[0].start_date} – ${rows[0].end_date}`}` : "Menu";


return (
<div className="mx-auto max-w-3xl p-4 space-y-6">
<h1 className="text-2xl font-semibold">{title}</h1>


{categories.map(cat => (
<div key={cat.id} className="rounded border p-3">
<h2 className="font-medium mb-2">{cat.name}</h2>
<div className="space-y-3">
{cat.items.map(it => (
<div key={it.item_id} className="flex items-start gap-3">
<div className="flex-1">
<div className="font-medium">
{it.item_name} {it.item_veg ? <span className="text-green-600">(Veg)</span> : null}
</div>
<div className="text-sm opacity-80">
{it.item_spice ? `Spice: ${it.item_spice}` : ""} {it.item_price != null ? ` • $${Number(it.item_price).toFixed(2)}` : ""}
</div>
<textarea
className="mt-2 w-full rounded border p-2 text-sm"
placeholder="Special instructions (optional)"
value={it.sel_instructions ?? ""}
onChange={e => update(it.item_id, { sel_instructions: e.target.value })}
/>
</div>
<div className="w-40">
<label className="block text-xs">Meal</label>
<select
className="w-full rounded border p-1 text-sm"
value={it.sel_session ?? ""}
onChange={e => update(it.item_id, { sel_session: (e.target.value || null) as MealType | null })}
>
<option value="">(None)</option>
<option value="BREAKFAST">Breakfast</option>
<option value="LUNCH">Lunch</option>
<option value="DINNER">Dinner</option>
<option value="SNACK">Snack</option>
<option value="OTHER">Other</option>
</select>


<label className="block mt-2 text-xs">Qty</label>
<input
type="number" min={0}
className="w-full rounded border p-1 text-sm"
value={it.sel_qty ?? 0}
onChange={e => update(it.item_id, { sel_qty: Math.max(0, Number(e.target.value || 0)) })}
/>
</div>
</div>
))}
</div>
</div>
))}


<div className="flex gap-3">
<button onClick={() => void save(false)} className="rounded border px-4 py-2">Save</button>
<button onClick={() => void save(true)} className="rounded bg-black text-white px-4 py-2">Submit</button>
</div>
</div>
);
}