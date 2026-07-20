# AI Resume Screener & Feedback

Score a resume against a job description (0–100), see missing keywords, and get
concrete rewrite suggestions — powered by Groq (Llama models via GroqCloud) (free tier).

**Stack:** Next.js 14 (App Router, TypeScript, Tailwind) + FastAPI (Python) + Groq API

---

## 1. Project structure

```
resume-screener/
├── backend/
│   ├── main.py                 # FastAPI app + routes
│   ├── requirements.txt
│   ├── .env.example            # <-- copy to .env and put your Groq key here
│   └── app/
│       ├── extractors.py       # PDF/DOCX/TXT text extraction
│       ├── prompts.py          # Prompt template (forces JSON output)
│       ├── llm_service.py      # Groq call + JSON validation + retry
│       └── models.py           # Pydantic request/response schemas
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx             # Main screening UI
    │   └── globals.css
    ├── components/
    │   ├── ResumeUpload.tsx
    │   ├── JobDescriptionInput.tsx
    │   └── ResultsDisplay.tsx   # Score gauge, keywords, suggestions
    ├── lib/api.ts               # Backend API client
    └── .env.local.example       # <-- copy to .env.local
```

---

## 2. Get a free Groq API key

1. Go to **https://console.groq.com/keys**
2. Sign in with a Google account, click **Create API key**.
3. Copy the key — you'll paste it in the backend `.env` file (step 3 below).

Free tier is enough for testing (rate-limited, resets daily).

---

## 3. Backend setup (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
```

**Open `backend/.env` and paste your key here — this is the ONLY place you need to add it:**

```env
GROQ_API_KEY=your_actual_key_here
GROQ_MODEL=openai/gpt-oss-120b
FRONTEND_ORIGIN=http://localhost:3000
```

Run the server:

```bash
uvicorn main:app --reload --port 8000
```

Backend is now live at `http://localhost:8000`. Check `http://localhost:8000/api/health`.

---

## 4. Frontend setup (Next.js)

In a **new terminal**:

```bash
cd frontend
npm install

cp .env.local.example .env.local
```

`.env.local` already points to the local backend by default:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run it:

```bash
npm run dev
```

Open **http://localhost:3000** — upload a resume, paste a job description, click "Score my resume".

---

## 5. How it works (matches the build order)

1. **Resume upload + text extraction** — `ResumeUpload.tsx` uploads the file to
   `POST /api/extract-resume`; `extractors.py` pulls text out of PDF (pypdf),
   DOCX (python-docx), or TXT.
2. **Job description input** — plain textarea, kept in React state.
3. **Prompt template (forces JSON)** — `prompts.py` builds a strict prompt that
   demands a single JSON object matching an exact schema.
4. **LLM integration** — `llm_service.py` calls Groq (`openai/gpt-oss-120b`) with
   `response_mime_type: "application/json"` to further force clean JSON.
5. **JSON validation + retry** — the response is parsed and validated against a
   Pydantic model (`ScreeningResult`). If it fails, the app automatically
   retries once with a stricter prompt that includes the validation error.
6. **Frontend display** — `ResultsDisplay.tsx` renders the score as a circular
   gauge, matched/missing keywords as chips, strengths/weaknesses, rewrite
   suggestions, and ATS formatting tips.
7. **Polish** — dark, technical UI (Space Grotesk + Inter + JetBrains Mono),
   loading/error states, drag-and-drop upload, responsive layout.

---

## 6. API reference

### `POST /api/extract-resume`
`multipart/form-data`, field `file` (pdf/docx/txt) → `{ success, filename, resume_text }`

### `POST /api/screen`
```json
{ "resume_text": "...", "job_description": "..." }
```
→
```json
{
  "success": true,
  "data": {
    "score": 78,
    "summary": "...",
    "matched_keywords": ["..."],
    "missing_keywords": ["..."],
    "strengths": ["..."],
    "weaknesses": ["..."],
    "rewrite_suggestions": [
      { "section": "Experience", "original": "...", "suggestion": "...", "reason": "..." }
    ],
    "ats_tips": ["..."]
  }
}
```

---

## 7. Notes / troubleshooting

- **"GROQ_API_KEY is not configured"** → you didn't create `backend/.env`, or forgot to restart `uvicorn` after adding it.
- **CORS errors** → make sure `FRONTEND_ORIGIN` in `backend/.env` matches the URL your Next.js app runs on.
- **Scanned/image-only PDF** → text extraction will fail (no OCR built in) — use a text-based PDF or DOCX.
- Free Groq tier has request-per-minute limits — if you hit one, wait a bit and retry.
- To deploy: backend → Render/Railway/Fly.io; frontend → Vercel (set `NEXT_PUBLIC_API_URL` to your deployed backend URL).
