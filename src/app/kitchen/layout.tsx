// src/app/kitchen/layout.tsx
'use client';

import { StaffGate } from '@/components/RoleGate';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return <StaffGate>{children}</StaffGate>;
}
