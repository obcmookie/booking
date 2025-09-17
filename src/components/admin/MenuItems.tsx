"use client";

import { useEffect, useState } from "react";
import type { MenuItemRow, Spice } from "@/components/types";

export function MenuItems({ categoryId }: { categoryId: string | null }) {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchItems = async () => {
    setLoading(true);
    const url = categoryId ? `/api/admin/menu/items?category_id=${categoryId}` : "/api/admin/menu/items";
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as { items: MenuItemRow[] };
      setItems(data.items);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchItems();
  }, [categoryId]);

  const addItem = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/menu/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "New Item",
        category_id: categoryId,
        veg: true,
        spice: null as Spice | null,
        price: 0,
        active: true,
      }),
    });
    if (res.ok) await fetchItems();
    setSaving(false);
  };

  const updateItem = async (id: string, patch: Partial<MenuItemRow>) => {
    setSaving(true);
    const res = await fetch(`/api/admin/menu/items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) await fetchItems();
    setSaving(false);
  };

  const removeItem = async (id: string) => {
    if (!confirm("Delete item?")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/menu/items/${id}`, { method: "DELETE" });
    if (res.ok) await fetchItems();
    setSaving(false);
  };

  if (loading) return <div className="p-2">Loading…</div>;

  const spiceOpts: Array<Spice | ""> = ["", "MILD", "MEDIUM", "HOT"];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Items</h2>
        <button className="border rounded px-2 py-1" disabled={saving} onClick={addItem}>
          + Add
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-1 pr-2">Name</th>
              <th className="py-1 pr-2">Veg</th>
              <th className="py-1 pr-2">Spice</th>
              <th className="py-1 pr-2">Price</th>
              <th className="py-1 pr-2">Active</th>
              <th className="py-1 pr-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b last:border-0">
                <td className="py-1 pr-2">
                  <input
                    className="border rounded px-2 py-1 w-56"
                    value={i.name}
                    onChange={(e) =>
                      setItems((prev) => prev.map((p) => (p.id === i.id ? { ...p, name: e.target.value } : p)))
                    }
                    onBlur={() => void updateItem(i.id, { name: i.name })}
                  />
                </td>

                <td className="py-1 pr-2">
                  <input type="checkbox" checked={i.veg} onChange={(e) => void updateItem(i.id, { veg: e.target.checked })} />
                </td>

                <td className="py-1 pr-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={i.spice || ""}
                    onChange={(e) => void updateItem(i.id, { spice: (e.target.value || null) as Spice | null })}
                  >
                    {spiceOpts.map((s) => (
                      <option key={s} value={s}>
                        {s || "(none)"}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="py-1 pr-2">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-28"
                    value={i.price ?? 0}
                    onChange={(e) =>
                      setItems((prev) => prev.map((p) => (p.id === i.id ? { ...p, price: Number(e.target.value || 0) } : p)))
                    }
                    onBlur={() => void updateItem(i.id, { price: i.price })}
                  />
                </td>

                <td className="py-1 pr-2">
                  <input type="checkbox" checked={i.active} onChange={(e) => void updateItem(i.id, { active: e.target.checked })} />
                </td>

                <td className="py-1 pr-2">
                  <button className="border rounded px-2 py-1" onClick={() => void removeItem(i.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
