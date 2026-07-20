"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function JobDescriptionInput({ value, onChange, disabled }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">
          <span className="text-signal-teal">02</span> Job description
        </label>
        <span className="font-mono text-[11px] text-slate-450">{value.length.toLocaleString()} chars</span>
      </div>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here — responsibilities, required skills, qualifications..."
        rows={10}
        className="focus-ring thin-scroll w-full resize-none rounded-xl border border-ink-600 bg-ink-900 px-4 py-3.5 text-sm leading-relaxed text-slate-100 placeholder:text-slate-450/70 disabled:opacity-50"
      />
    </div>
  );
}
