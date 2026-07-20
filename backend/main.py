"""
FastAPI entrypoint.

Run with:
    uvicorn main:app --reload --port 8000

Endpoints:
    POST /api/extract-resume   -> upload PDF/DOCX/TXT, get back extracted text
    POST /api/screen           -> resume_text + job_description -> ScreeningResult JSON
    GET  /api/health           -> simple health check
"""

import os
from dotenv import load_dotenv

load_dotenv()  # loads backend/.env if present (must run before importing llm_service)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.extractors import extract_text_from_upload
from app.llm_service import screen_resume
from app.models import ScreenRequest, ScreenResponse

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app = FastAPI(title="AI Resume Screener API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/extract-resume")
async def extract_resume(file: UploadFile = File(...)):
    """Step 1: Resume upload + text extraction."""
    text = await extract_text_from_upload(file)
    return {"success": True, "filename": file.filename, "resume_text": text}


@app.post("/api/screen", response_model=ScreenResponse)
async def screen(payload: ScreenRequest):
    """
    Steps 3-5: Prompt template -> LLM call -> JSON validation/retry.
    Takes already-extracted resume text + job description.
    """
    try:
        result = screen_resume(payload.resume_text, payload.job_description)
        return ScreenResponse(success=True, data=result)
    except ValueError as exc:
        # LLM kept failing to return valid JSON after retries
        raise HTTPException(status_code=502, detail=str(exc))
    except RuntimeError as exc:
        # Missing API key etc.
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}")
