"""
Pydantic models used across the app.

These serve two purposes:
1. Validate incoming API requests.
2. Validate the JSON that comes back from the LLM (Gemini). If Gemini's
   output doesn't match `ScreeningResult`, validation fails and the
   caller (llm_service.py) retries with a stricter prompt.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List


class ScreenRequest(BaseModel):
    resume_text: str = Field(..., min_length=20, description="Extracted plain text of the resume")
    job_description: str = Field(..., min_length=20, description="Full job description text")


class KeywordMatch(BaseModel):
    keyword: str
    present: bool


class RewriteSuggestion(BaseModel):
    section: str = Field(..., description="Resume section this suggestion applies to, e.g. 'Experience', 'Summary'")
    original: str = Field(default="", description="Original text/bullet if applicable (can be empty)")
    suggestion: str = Field(..., description="Concrete rewritten/improved version")
    reason: str = Field(..., description="Why this improves ATS match / clarity")


class ScreeningResult(BaseModel):
    """
    This is the exact JSON shape we force the LLM to return.
    Field names MUST match the prompt template in prompts.py.
    """
    score: int = Field(..., ge=0, le=100, description="Overall ATS match score 0-100")
    summary: str = Field(..., description="2-3 sentence summary of the fit")
    matched_keywords: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    rewrite_suggestions: List[RewriteSuggestion] = Field(default_factory=list)
    ats_tips: List[str] = Field(default_factory=list, description="General ATS formatting tips")

    @field_validator("score")
    @classmethod
    def clamp_score(cls, v: int) -> int:
        return max(0, min(100, v))


class ScreenResponse(BaseModel):
    success: bool
    data: ScreeningResult | None = None
    error: str | None = None
