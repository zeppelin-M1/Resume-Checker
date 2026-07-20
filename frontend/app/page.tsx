"use client";

import { useState } from "react";
import ResumeUpload from "@/components/ResumeUpload";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import ResultsDisplay from "@/components/ResultsDisplay";
import { ApiError, extractResumeText, screenResume, type ScreeningResult } from "@/lib/api";

type Status = "idle" | "extracting" | "screening" | "done" | "error";

export default function Home() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [result, setResult] = useState<ScreeningResult | null>(null);

  const isBusy = status === "extracting" || status === "screening";
  const canSubmit = resumeText.trim().length > 20 && jobDescription.trim().length > 20 && !isBusy;

  async function handleFileSelected(file: File) {
    setFileName(file.name);
    setErrorMsg("");
    setStatus("extracting");
    try {
      const text = await extractResumeText(file);
      setResumeText(text);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not read that file.");
    }
  }

  async function handleSubmit() {
    setErrorMsg("");
    setResult(null);
    setStatus("screening");
    try {
      const data = await screenResume(resumeText, jobDescription);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Something went wrong while screening.");
    }
  }

  return (
    <main className="min-h-screen bg-ink-950">
      {/* Header */}
      <header className="bg-scan-grid border-b border-ink-700">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:py-16">
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-signal-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-teal" />
            ATS resume screener
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
            Know your match score before you hit submit.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-450">
            Upload a resume, paste the job description, and get a 0–100 ATS score with the exact
            keywords you're missing and how to fix them.
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <ResumeUpload onFileSelected={handleFileSelected} fileName={fileName} disabled={isBusy} />
          <JobDescriptionInput value={jobDescription} onChange={setJobDescription} disabled={isBusy} />
        </div>

        {status === "extracting" && (
          <p className="mt-4 font-mono text-xs text-slate-450">Extracting text from resume…</p>
        )}

        {errorMsg && (
          <div className="mt-6 rounded-lg border border-signal-rose/30 bg-signal-rose/10 px-4 py-3 text-sm text-signal-rose">
            {errorMsg}
          </div>
        )}

        <div className="mt-7 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="focus-ring rounded-lg bg-signal-teal px-6 py-3 text-sm font-medium text-ink-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {status === "screening" ? "Scoring resume…" : "Score my resume"}
          </button>
        </div>

        {result && (
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-teal" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">Results</h2>
            </div>
            <ResultsDisplay result={result} />
          </div>
        )}
      </div>

      <footer className="border-t border-ink-700 py-8 text-center font-mono text-[11px] text-slate-450">
        Built with Next.js · FastAPI · Gemini
      </footer>
    </main>
  );
}
