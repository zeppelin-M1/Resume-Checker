"""
LLM integration layer (Groq).

Responsibilities:
- Call Groq (OpenAI-compatible chat API) with the screening prompt.
- Strip any markdown fences the model might add despite instructions.
- Parse + validate the JSON against ScreeningResult (Pydantic).
- If parsing/validation fails, retry once with a stricter prompt.

>>> THIS IS WHERE YOUR GROQ API KEY IS USED <<<
It's read from the GROQ_API_KEY environment variable (see .env.example).
You do NOT need to edit this file to add your key — just create a `.env`
file in /backend with GROQ_API_KEY=your_key_here.
Get a free key at: https://console.groq.com/keys
"""

import os
import json
import re
from pydantic import ValidationError
from groq import Groq

from .models import ScreeningResult
from .prompts import build_screening_prompt, build_retry_prompt

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY is not set. Add it to backend/.env")

MAX_RETRIES = 2  # 1 initial call + 1 retry


def _strip_markdown_fences(text: str) -> str:
    """Groq sometimes wraps JSON in ```json ... ``` despite instructions."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _extract_json_object(text: str) -> str:
    """Grab the outermost {...} block in case the model adds stray text."""
    text = _strip_markdown_fences(text)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        return text
    return text[start : end + 1]


def _call_groq(prompt: str) -> str:
    if not client:
        raise RuntimeError(
            "GROQ_API_KEY is not configured on the server. "
            "Create backend/.env from backend/.env.example and add your key."
        )

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        response_format={"type": "json_object"},  # forces raw JSON output
    )
    return response.choices[0].message.content


def screen_resume(resume_text: str, job_description: str) -> ScreeningResult:
    """
    Main entry point. Calls Groq, validates JSON, retries on failure.
    Raises ValueError with a readable message if all attempts fail.
    """
    last_error = ""
    prompt = build_screening_prompt(resume_text, job_description)

    for attempt in range(1, MAX_RETRIES + 1):
        raw_text = _call_groq(prompt)
        json_str = _extract_json_object(raw_text)

        try:
            parsed = json.loads(json_str)
        except json.JSONDecodeError as exc:
            last_error = f"Invalid JSON syntax: {exc}"
            prompt = build_retry_prompt(resume_text, job_description, last_error)
            continue

        try:
            result = ScreeningResult(**parsed)
            return result  # success
        except ValidationError as exc:
            last_error = f"Schema validation failed: {exc}"
            prompt = build_retry_prompt(resume_text, job_description, last_error)
            continue

    raise ValueError(f"LLM failed to return valid JSON after {MAX_RETRIES} attempts. Last error: {last_error}")
