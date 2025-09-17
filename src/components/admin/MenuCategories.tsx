"use client";

import { useEffect, useState } from "react";
import type { MenuCategoryRow } from "@/components/types";

export function MenuCategories({ onSelect }: { onSelect: (id: string | null) => void }) {
  const [cats, setCats] = useState<MenuCategoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchCats = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/menu/categories");
    if (res.ok) {
      const data = (await res.json()) as { categories: MenuCategoryRow[] };
      setCats(data.categories);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchCats();
  }, []);

  const addCategory = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/menu/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "New Category", sort_order: 100 }),
    });
    if (res.ok) await fetchCats();
    setSaving(false);
  };

  const updateCategory = async (id: string, patch: Partial<MenuCategoryRow>) => {
    setSaving(true);
    const res = await fetch(`/api/admin/menu/categories/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) await fetchCats();
    setSaving(false);
  };

  const removeCategory = async (id: string) => {
    if (!confirm("Delete category? This will not delete items, but they’ll be uncategorized.")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/menu/categories/${id}`, { method: "DELETE" });
    if (res.ok) await fetchCats();
    setSaving(false);
  };

  if (loading) return <div className="p-2">Loading…</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Categories</h2>
        <button className="border rounded px-2 py-1" disabled={saving} onClick={addCategory}>
          + Add
        </button>
      </div>

      <ul className="space-y-1">
        <li>
          <button
            className={`w-full text-left px-2 py-1 rounded ${activeId === null ? "bg-gray-100" : ""}`}
            onClick={() => {
              setActiveId(null);
              onSelect(null);
            }}
          >
            All
          </button>
        </li>

        {cats.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <button
              className={`flex-1 text-left px-2 py-1 rounded ${activeId === c.id ? "bg-gray-100" : ""}`}
              onClick={() => {
                setActiveId(c.id);
                onSelect(c.id);
              }}
            >
              {c.name}
            </button>

            <input
              className="border rounded px-2 py-1 w-28"
              value={c.sort_order}
              onChange={(e) => void updateCategory(c.id, { sort_order: Number(e.target.value || 0) })}
            />

            <button className="border rounded px-2 py-1" onClick={() => void removeCategory(c.id)}>
              Del
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
