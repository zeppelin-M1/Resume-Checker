"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  fileName: string | null;
  disabled?: boolean;
}

export default function ResumeUpload({ onFileSelected, fileName, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFileSelected(files[0]);
    },
    [onFileSelected]
  );

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-450">
        <span className="text-signal-teal">01</span> Resume
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`focus-ring group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        } ${
          isDragging
            ? "border-signal-teal bg-signal-teal/5"
            : "border-ink-600 bg-ink-900 hover:border-ink-600/80 hover:bg-ink-800"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          className={`mb-3 transition-colors ${fileName ? "text-signal-teal" : "text-slate-450 group-hover:text-slate-200"}`}
        >
          <path
            d="M12 16V4M12 4L7 9M12 4l5 5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {fileName ? (
          <p className="max-w-full truncate font-mono text-sm text-slate-100">{fileName}</p>
        ) : (
          <>
            <p className="text-sm text-slate-200">
              Drop your resume here, or <span className="text-signal-teal">browse</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-450">PDF · DOCX · TXT — up to 10MB</p>
          </>
        )}
      </div>
    </div>
  );
}
