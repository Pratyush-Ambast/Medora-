'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const j = await r.json();
    if (!r.ok) { setError(j.error || 'Invalid username or password.'); return; }
    router.push(j.role === 'provider' ? '/provider' : j.role === 'pharmacy' ? '/pharmacy' : '/patient');
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <Logo />
        <div className="soft-card mt-12 p-8">
          <div className="eyebrow">Welcome back</div>
          <h1 className="mt-2 text-3xl font-black">Sign in to Medora</h1>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-sm font-bold">
              Username
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="patient, pharmacy or provider" className="mt-2 w-full rounded-xl border border-[#deded7] bg-white px-4 py-3" required />
            </label>
            <label className="block text-sm font-bold">
              Password
              <input value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[#deded7] bg-white px-4 py-3" type="password" required />
            </label>
            {error && <p className="rounded-xl bg-[#f7ebe7] p-3 text-sm text-[#8b554b]">{error}</p>}
            <button className="btn btn-dark w-full" type="submit">Sign in</button>
          </form>
        </div>
        <details className="mt-4 text-center text-xs text-[#7b8580]">
          <summary className="cursor-pointer select-none hover:text-[#26332f]">For the demo walkthrough</summary>
          <div className="mx-auto mt-3 max-w-sm rounded-2xl border border-[#e8e7df] bg-[#fafaf7] p-4 text-left">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b948f]">Demo access</p>
            <div className="space-y-2 text-[#65716c]">
              <div className="flex justify-between gap-4"><span>Patient</span><code>demo_patient</code></div>
              <div className="flex justify-between gap-4"><span>Pharmacy</span><code>demo_pharmacy</code></div>
              <div className="flex justify-between gap-4"><span>Provider</span><code>demo_provider</code></div>
              <div className="mt-3 border-t border-[#e8e7df] pt-3 text-center"><span>Password: </span><code>demo@123</code></div>
            </div>
          </div>
        </details>
        <div className="mt-5 text-center text-sm text-[#77837e]">
          New to Medora? <Link href="/signup" className="font-bold text-[#26332f]">Get started</Link>
        </div>
      </div>
    </main>
  );
}
