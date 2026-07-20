"""
Prompt template(s) for the LLM.

The prompt is written to force a single, strict JSON object as output,
matching the ScreeningResult schema in models.py exactly. We also
provide a "retry" variant that's even stricter, used when the first
response fails JSON validation.
"""

JSON_SCHEMA_DESCRIPTION = """
{
  "score": <integer 0-100, overall ATS/job match score>,
  "summary": "<2-3 sentence plain-language summary of how well the resume fits the job>",
  "matched_keywords": ["<keyword or skill from the JD that IS present in the resume>", ...],
  "missing_keywords": ["<important keyword/skill from the JD that is MISSING from the resume>", ...],
  "strengths": ["<short bullet on a resume strength relative to this JD>", ...],
  "weaknesses": ["<short bullet on a resume gap relative to this JD>", ...],
  "rewrite_suggestions": [
    {
      "section": "<e.g. Summary, Experience, Skills>",
      "original": "<original bullet/line from the resume, or empty string if it's a new addition>",
      "suggestion": "<concrete rewritten version that is more ATS-friendly and impactful>",
      "reason": "<why this is better - e.g. adds missing keyword, quantifies impact>"
    }
  ],
  "ats_tips": ["<general formatting/ATS-compatibility tip>", ...]
}
""".strip()


def build_screening_prompt(resume_text: str, job_description: str) -> str:
    return f"""You are an expert ATS (Applicant Tracking System) resume screener and career coach with 15 years of experience in technical recruiting.

Your task: compare the RESUME against the JOB DESCRIPTION and produce a strict evaluation.

Scoring rubric (be realistic and critical, not generous):
- Keyword/skill overlap with the job description (40%)
- Relevant experience level and role alignment (30%)
- Quantified achievements and impact (15%)
- ATS-friendly formatting signals in the text (headings, clear sections, no weird artifacts) (15%)

Identify:
- Important keywords/skills/tools from the JOB DESCRIPTION and whether each appears in the RESUME (matched vs missing). Focus on concrete nouns: skills, tools, certifications, methodologies, years of experience — not filler words.
- 3-6 genuine strengths and 3-6 genuine weaknesses/gaps.
- 3-5 concrete rewrite suggestions for specific resume bullets/lines that would make the resume score higher against THIS job description (e.g., inserting a missing keyword naturally, quantifying an achievement, tightening a vague sentence).
- 3-5 general ATS formatting tips relevant to this resume specifically.

=== RESUME ===
{resume_text}

=== JOB DESCRIPTION ===
{job_description}

=== OUTPUT FORMAT ===
Return ONLY a single valid JSON object. No markdown code fences, no explanation, no preamble, no trailing text — JUST the raw JSON object, matching this exact schema:

{JSON_SCHEMA_DESCRIPTION}

Rules:
- "score" must be an integer between 0 and 100.
- All arrays must contain at least 1 item where reasonably possible.
- Keep each string concise (1-2 sentences max).
- Output must be valid JSON that can be parsed by a standard JSON parser (double-quoted keys/strings, no trailing commas, no comments).
"""


def build_retry_prompt(resume_text: str, job_description: str, previous_error: str) -> str:
    base = build_screening_prompt(resume_text, job_description)
    return f"""{base}

IMPORTANT: Your previous response failed JSON validation with this error:
"{previous_error}"

This time, respond with ONLY the raw JSON object described above. Do not wrap it in ```json code fences. Do not add any text before or after the JSON. Double-check that every key is present and every type matches (score is an integer, arrays are arrays, etc.)."""
