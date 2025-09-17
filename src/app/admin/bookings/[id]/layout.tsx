import type { ReactNode } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";

interface Params {
  id: string;
}

export default async function Layout(props: {
  children: ReactNode;
  params: Promise<Params>;
}) {
  const { id } = await props.params;

  return (
    <div className="p-4">
      <AdminTabs base={`/admin/bookings/${id}`} />
      {props.children}
    </div>
  );
}
