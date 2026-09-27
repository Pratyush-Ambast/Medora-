'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { HeartPulse, Hospital, Store } from 'lucide-react';

type Role = 'patient' | 'pharmacy' | 'provider';

const roles: { id: Role; title: string; description: string; icon: typeof HeartPulse }[] = [
  { id: 'patient', title: 'Patient', description: 'Track your prescriptions and refill status.', icon: HeartPulse },
  { id: 'pharmacy', title: 'Pharmacy', description: 'Coordinate refill requests and blockers.', icon: Store },
  { id: 'provider', title: 'Provider', description: 'Review requests and update the workflow.', icon: Hospital },
];

export default function Signup() {
  const [role, setRole] = useState<Role>('patient');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('Creating account…');
    const r = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password, role }),
    });
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error || 'Could not create account.');
      return;
    }
    setMsg('Account created. You are signed in.');
    setTimeout(() => router.push(j.role === 'provider' ? '/provider' : j.role === 'pharmacy' ? '/pharmacy' : '/patient'), 500);
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-3xl">
        <Logo />
        <div className="soft-card mt-12 p-8">
          <div className="eyebrow">Get started</div>
          <h1 className="mt-2 text-3xl font-black">Create your Medora account</h1>
          <p className="mt-2 text-[#6d7975]">Choose your role, then create your account.</p>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {roles.map(({ id, title, description, icon: Icon }) => (
              <button type="button" key={id} onClick={() => setRole(id)} className={`rounded-2xl border p-4 text-left transition ${role === id ? 'border-[#628573] bg-[#edf4ef]' : 'border-[#e5e4dd] bg-white hover:bg-[#f7f7f3]'}`}>
                <div className="flex items-center gap-3"><Icon size={20} /><span className="font-black">{title}</span></div>
                <p className="mt-2 text-xs leading-5 text-[#6d7975]">{description}</p>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-7 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold">Full name<input value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#deded7] bg-white px-4 py-3" required /></label>
            <label className="block text-sm font-bold">Username<input value={username} onChange={e => setUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-[#deded7] bg-white px-4 py-3" required /></label>
            <label className="block text-sm font-bold md:col-span-2">Password<input value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[#deded7] bg-white px-4 py-3" type="password" minLength={8} required /></label>
            {msg && <p className="rounded-xl bg-[#edf4ef] p-3 text-sm text-[#526e60] md:col-span-2">{msg}</p>}
            <button className="btn btn-dark w-full md:col-span-2">Create account</button>
          </form>
        </div>
        <div className="mt-5 text-center text-sm text-[#77837e]">Already have an account? <Link href="/login" className="font-bold">Log in</Link></div>
      </div>
    </main>
  );
}
