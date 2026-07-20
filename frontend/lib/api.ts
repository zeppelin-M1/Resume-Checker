// Central place for all backend calls.
// Change NEXT_PUBLIC_API_URL in .env.local if your backend runs elsewhere.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RewriteSuggestion {
  section: string;
  original: string;
  suggestion: string;
  reason: string;
}

export interface ScreeningResult {
  score: number;
  summary: string;
  matched_keywords: string[];
  missing_keywords: string[];
  strengths: string[];
  weaknesses: string[];
  rewrite_suggestions: RewriteSuggestion[];
  ats_tips: string[];
}

export class ApiError extends Error {}

export async function extractResumeText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/extract-resume`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail || "Failed to extract resume text.");
  }

  const data = await res.json();
  return data.resume_text as string;
}

export async function screenResume(
  resumeText: string,
  jobDescription: string
): Promise<ScreeningResult> {
  const res = await fetch(`${API_URL}/api/screen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription,
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(body.detail || "Screening failed.");
  }

  if (!body.success || !body.data) {
    throw new ApiError(body.error || "Screening failed.");
  }

  return body.data as ScreeningResult;
}
