// src/components/LoginModal.tsx
'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';

export default function LoginModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border px-4 py-2 hover:bg-gray-50"
      >
        Admin / Kitchen Login
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Sign in</h2>
              <button onClick={() => setOpen(false)} className="rounded-md px-2 py-1 hover:bg-gray-100">✕</button>
            </div>
            <LoginForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
