"use client";

import type { ScreeningResult } from "@/lib/api";

function scoreColor(score: number) {
  if (score >= 75) return { stroke: "#14B8A6", text: "text-signal-teal", label: "Strong match" };
  if (score >= 50) return { stroke: "#F5A623", text: "text-signal-amber", label: "Partial match" };
  return { stroke: "#F0546B", text: "text-signal-rose", label: "Needs work" };
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { stroke, text, label } = scoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1F2A40" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-semibold text-slate-50">{score}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-450">/ 100</span>
        </div>
      </div>
      <span className={`mt-3 font-mono text-xs uppercase tracking-[0.18em] ${text}`}>{label}</span>
    </div>
  );
}

function KeywordChips({ items, variant }: { items: string[]; variant: "matched" | "missing" }) {
  if (items.length === 0) return <p className="text-sm text-slate-450">None found.</p>;
  const isMatched = variant === "matched";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((kw, i) => (
        <span
          key={i}
          className={`rounded-full border px-2.5 py-1 font-mono text-[12px] ${
            isMatched
              ? "border-signal-teal/30 bg-signal-teal/10 text-signal-teal"
              : "border-signal-rose/30 bg-signal-rose/10 text-signal-rose"
          }`}
        >
          {isMatched ? "✓" : "×"} {kw}
        </span>
      ))}
    </div>
  );
}

export default function ResultsDisplay({ result }: { result: ScreeningResult }) {
  return (
    <div className="space-y-6">
      {/* Score + summary */}
      <div className="flex flex-col gap-6 rounded-xl border border-ink-600 bg-ink-900 p-6 sm:flex-row sm:items-center">
        <ScoreGauge score={result.score} />
        <div className="flex-1">
          <h3 className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">Summary</h3>
          <p className="text-[15px] leading-relaxed text-slate-100">{result.summary}</p>
        </div>
      </div>

      {/* Keywords */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-600 bg-ink-900 p-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">
            Matched keywords ({result.matched_keywords.length})
          </h3>
          <KeywordChips items={result.matched_keywords} variant="matched" />
        </div>
        <div className="rounded-xl border border-ink-600 bg-ink-900 p-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">
            Missing keywords ({result.missing_keywords.length})
          </h3>
          <KeywordChips items={result.missing_keywords} variant="missing" />
        </div>
      </div>

      {/* Strengths / weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-600 bg-ink-900 p-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">Strengths</h3>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-200">
                <span className="mt-0.5 text-signal-teal">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-ink-600 bg-ink-900 p-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">Weaknesses</h3>
          <ul className="space-y-2">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-200">
                <span className="mt-0.5 text-signal-rose">−</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Rewrite suggestions */}
      {result.rewrite_suggestions.length > 0 && (
        <div className="rounded-xl border border-ink-600 bg-ink-900 p-5">
          <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">
            Rewrite suggestions
          </h3>
          <div className="space-y-4">
            {result.rewrite_suggestions.map((r, i) => (
              <div key={i} className="rounded-lg border border-ink-700 bg-ink-800 p-4">
                <span className="mb-2 inline-block rounded-full bg-ink-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-450">
                  {r.section}
                </span>
                {r.original && (
                  <p className="mb-2 text-sm text-slate-450 line-through decoration-signal-rose/50">{r.original}</p>
                )}
                <p className="mb-2 text-sm leading-relaxed text-slate-100">{r.suggestion}</p>
                <p className="font-mono text-[12px] text-signal-teal">→ {r.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATS tips */}
      {result.ats_tips.length > 0 && (
        <div className="rounded-xl border border-ink-600 bg-ink-900 p-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">
            ATS formatting tips
          </h3>
          <ul className="space-y-2">
            {result.ats_tips.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-200">
                <span className="mt-0.5 text-signal-amber">▸</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
