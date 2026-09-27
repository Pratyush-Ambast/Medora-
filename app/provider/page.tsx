import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LiveRefill } from '@/components/LiveRefill';

export default function Provider() {
  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-2 font-black"><ArrowLeft size={17} /> Medora</Link><span className="rounded-full bg-white px-4 py-2 text-xs font-bold shadow-sm">PROVIDER</span></div>
        <div className="mt-10"><div className="eyebrow">Provider organization</div><h1 className="mt-2 text-4xl font-black">Review what needs your decision.</h1><p className="mt-2 text-[#6d7975]">Clinical actions remain with the authorized provider; Medora keeps the workflow and evidence connected.</p></div>
        <div className="mt-9"><LiveRefill role="provider" /></div>
      </div>
    </main>
  );
}
