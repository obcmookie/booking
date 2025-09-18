"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RentalItemRow, PriceMode } from "@/components/types";

interface NewItemBody {
  name: string;
  description: string | null;
  price_mode: PriceMode;
  unit_price: number;
  category: string | null;
  active: boolean;
  sort_order: number;
}

export default function ServicesPage() {
  const [items, setItems] = useState<RentalItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/rentals");
    if (res.ok) {
      const data = (await res.json()) as { items: RentalItemRow[] };
      setItems(data.items);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category || "(uncategorized)"))),
    [items]
  );

  const createItem = async () => {
    const body: NewItemBody = {
      name: "New Item",
      description: null,
      price_mode: "FLAT",
      unit_price: 0,
      category: null,
      active: true,
      sort_order: 100,
    };
    setSaving(true);
    const res = await fetch("/api/admin/rentals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) await fetchItems();
    setSaving(false);
  };

  const updateItem = async (id: string, patch: Partial<RentalItemRow>) => {
    setSaving(true);
    const res = await fetch(`/api/admin/rentals/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) await fetchItems();
    setSaving(false);
  };

  const removeItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/rentals/${id}`, { method: "DELETE" });
    if (res.ok) await fetchItems();
    setSaving(false);
  };

  if (loading) return <div className="p-2">Loading…</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Services Catalog</h1>
        <button onClick={createItem} disabled={saving} className="border rounded px-3 py-1.5">
          + New
        </button>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="border rounded p-3">
          <div className="font-medium mb-2">{cat}</div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1 pr-2">Name</th>
                  <th className="py-1 pr-2">Mode</th>
                  <th className="py-1 pr-2">Unit Price</th>
                  <th className="py-1 pr-2">Active</th>
                  <th className="py-1 pr-2">Sort</th>
                  <th className="py-1 pr-2">Category</th>
                  <th className="py-1 pr-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter((i) => (i.category || "(uncategorized)") === cat)
                  .map((i) => (
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
                        <select
                          className="border rounded px-2 py-1"
                          value={i.price_mode}
                          onChange={(e) => void updateItem(i.id, { price_mode: e.target.value as PriceMode })}
                        >
                          <option value="FLAT">FLAT</option>
                          <option value="PER_DAY">PER_DAY</option>
                          <option value="PER_HOUR">PER_HOUR</option>
                        </select>
                      </td>

                      <td className="py-1 pr-2">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-28"
                          value={i.unit_price}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((p) =>
                                p.id === i.id ? { ...p, unit_price: Number(e.target.value || 0) } : p
                              )
                            )
                          }
                          onBlur={() => void updateItem(i.id, { unit_price: i.unit_price })}
                        />
                      </td>

                      <td className="py-1 pr-2">
                        <input
                          type="checkbox"
                          checked={i.active}
                          onChange={(e) => void updateItem(i.id, { active: e.target.checked })}
                        />
                      </td>

                      <td className="py-1 pr-2">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-20"
                          value={i.sort_order}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((p) => (p.id === i.id ? { ...p, sort_order: Number(e.target.value || 0) } : p))
                            )
                          }
                          onBlur={() => void updateItem(i.id, { sort_order: i.sort_order })}
                        />
                      </td>

                      <td className="py-1 pr-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={i.category || ""}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((p) => (p.id === i.id ? { ...p, category: e.target.value || null } : p))
                            )
                          }
                          onBlur={() => void updateItem(i.id, { category: i.category })}
                        />
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
      ))}
    </div>
  );
      }
                      
