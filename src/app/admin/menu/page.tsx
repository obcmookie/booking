"use client";

import { useState } from "react";
import { MenuCategories } from "@/components/admin/MenuCategories";
import { MenuItems } from "@/components/admin/MenuItems";

export default function AdminMenuPage() {
  const [categoryId, setCategoryId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Food Menu Catalog</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <aside className="md:col-span-1">
          <MenuCategories onSelect={setCategoryId} />
        </aside>

        <main className="md:col-span-3">
          <MenuItems categoryId={categoryId} />
        </main>
      </div>
    </div>
  );
}
