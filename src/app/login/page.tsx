// src/app/login/page.tsx
'use client';

import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
      <LoginForm />
    </div>
  );
}
