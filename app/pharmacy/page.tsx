
'use client';
import Link from 'next/link';
import { ArrowLeft, UploadCloud, Sparkles, Loader2, FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { LiveRefill } from '@/components/LiveRefill';

type ParsedPrescription = {
  patient_name: string;
  medication: string;
  dosage: string;
  frequency: string;
  refills_remaining: number;
  requires_provider_review: boolean;
  notes: string;
};

export default function Pharmacy() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParsedPrescription | null>(null);

  const parseFile = async (file: File) => {
    setParsing(true);
    setError('');
    setParsed(null);
    setFileName(file.name);
    const form = new FormData();
    form.append('file', file);
    try {
      const response = await fetch('/api/parse-prescription', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Prescription parsing failed.');
      setParsed(data.prescription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prescription parsing failed.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-2 font-black"><ArrowLeft size={17} /> Medora</Link><span className="rounded-full bg-white px-4 py-2 text-xs font-bold shadow-sm">PHARMACY</span></div>
        <div className="mt-10"><div className="eyebrow">Pharmacy workspace</div><h1 className="mt-2 text-4xl font-black">Keep every refill moving.</h1><p className="mt-2 text-[#6d7975]">Upload a prescription, understand the blocker, and coordinate the next action.</p></div>
        <div className="mt-9 mb-5 soft-card p-7">
          <div className="flex items-center justify-between"><div><div className="eyebrow">Prescription intake</div><h2 className="mt-2 text-xl font-black">Upload prescription</h2><p className="mt-1 text-sm text-[#6d7975]">Gemini reads the prescription and extracts the workflow fields for the pharmacy.</p></div><UploadCloud size={25}/></div>
          <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void parseFile(file); }} />
          <button type="button" disabled={parsing} onClick={() => inputRef.current?.click()} className="mt-6 grid min-h-32 w-full place-items-center rounded-3xl border-2 border-dashed border-[#cfd8d2] bg-[#f5f8f5] p-6 text-center hover:bg-[#eef4ef] disabled:opacity-60">
            <div>{parsing ? <><Loader2 className="mx-auto animate-spin" size={25}/><div className="mt-2 font-black">Reading prescription…</div></> : <><div className="font-black">Click to upload prescription</div><div className="mt-1 text-sm text-[#77837e]">PDF, JPG or PNG · up to 10 MB</div></>}</div>
          </button>
          {fileName && !parsing && <div className="mt-4 flex items-center gap-2 text-sm text-[#66746e]"><FileText size={16}/> {fileName}</div>}
          {error && <div className="mt-4 rounded-2xl bg-[#f7ebe7] p-4 text-sm font-semibold text-[#8b554b]">{error}</div>}
          {parsed && <div className="mt-5 rounded-2xl bg-[#eaf3ed] p-5"><div className="flex gap-3"><Sparkles size={19}/><div className="min-w-0 flex-1"><div className="font-bold">AI extraction complete</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Patient" value={parsed.patient_name}/><Field label="Medication" value={parsed.medication}/><Field label="Dosage" value={parsed.dosage}/><Field label="Frequency" value={parsed.frequency}/><Field label="Refills remaining" value={String(parsed.refills_remaining)}/><Field label="Provider review" value={parsed.requires_provider_review ? 'Required' : 'Not indicated'}/></div>{parsed.notes && <p className="mt-4 text-sm text-[#66746e]">Note: {parsed.notes}</p>}</div></div></div>}
        </div>
        <LiveRefill role="pharmacy" />
      </div>
    </main>
  );
}

function Field({label,value}:{label:string;value:string}) {
  return <div className="rounded-xl bg-white/70 p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-[#84908b]">{label}</div><div className="mt-1 font-semibold">{value || 'Not found'}</div></div>;
}
