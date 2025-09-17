import { AdminTabs } from "@/components/admin/AdminTabs";


export default function BookingLayout({ params, children }: { params: { id: string }, children: React.ReactNode }) {
const base = `/admin/bookings/${params.id}`;
return (
<div className="p-4">
<h1 className="text-2xl font-semibold mb-2">Booking #{params.id}</h1>
<AdminTabs base={base} />
<div>{children}</div>
</div>
);
}