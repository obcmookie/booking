// src/app/admin/layout.tsx
'use client';

import { AdminGate } from '@/components/RoleGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
