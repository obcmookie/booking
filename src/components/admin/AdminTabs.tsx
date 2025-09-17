"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";


interface TabDef {
href: string;
label: string;
}


export function AdminTabs({ base }: { base: string }) {
const pathname = usePathname();
const tabs: TabDef[] = [
{ href: `${base}/overview`, label: "Overview" },
{ href: `${base}/schedule`, label: "Schedule" },
{ href: `${base}/rentals`, label: "Rentals" },
{ href: `${base}/menu`, label: "Menu" },
{ href: `${base}/proposal`, label: "Proposal" },
];
return (
<div className="border-b mb-4 flex gap-2 overflow-x-auto">
{tabs.map(t => {
const active = pathname?.startsWith(t.href);
return (
<Link
key={t.href}
href={t.href}
className={`px-3 py-2 text-sm rounded-t ${active ? "bg-white border border-b-white" : "text-gray-600 hover:text-black"}`}
>
{t.label}
</Link>
);
})}
</div>
);
}