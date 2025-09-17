"use client";
import { MenuCategories } from "@/components/admin/MenuCategories";
import { MenuItems } from "@/components/admin/MenuItems";
import { useState } from "react";


export default function AdminMenuPage() {
const [catId, setCatId] = useState<string | null>(null);
return (
<div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="md:col-span-1 border rounded p-3">
<MenuCategories onSelect={setCatId} />
</div>
<div className="md:col-span-2 border rounded p-3">
<MenuItems categoryId={catId} />
</div>
</div>
);
}