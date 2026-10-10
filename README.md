# Verilens AI

> **"See the signals. Understand the risk."**

An evidence-first AI assistant that analyzes suspicious messages — internship offers, job ads, payment requests, digital scams — identifies exact warning phrases, explains manipulation tactics, and recommends safe verification steps without making claims it cannot prove.

**Hackathon track:** PS-03 — AI for Communities, Access & Public Impact

---

## Problem

People receive suspicious internship offers, job advertisements, emails, and payment requests but struggle to recognize warning signs or know what to verify. Generic scam detectors give binary verdicts without explaining *why* something is suspicious or *what to do next*.

## Solution

Verilens AI is an evidence-first assistant that:
- Highlights **exact phrases** from the submitted message that are suspicious
- Explains **why each phrase matters** (manipulation tactics, fraud patterns)
- Lists **missing verification evidence** (what the message doesn't include)
- Provides **safe, practical next steps** grounded in the actual content
- Returns a qualitative assessment: **Low Concern / Needs Verification / High Concern**
- **Never claims fraud** without direct evidence — all findings are clearly labelled as observed signals, not proof

---

## Features

| Feature | Details |
|---------|---------|
| Message analysis | Paste any suspicious text up to 8,000 characters |
| Evidence-first findings | Each warning links to an exact quoted phrase |
| Severity levels | High / Medium / Low per finding |
| Missing evidence | Lists what a legitimate offer would normally include |
| Verification steps | Safe, actionable steps to check legitimacy |
| Demo mode | Rule-based analysis with honest labelling (no AI key needed) |
| AI mode | Full GPT-4o-mini analysis when `OPENAI_API_KEY` is set |
| Keyboard accessible | Ctrl+Enter to submit, semantic HTML, ARIA labels |
| Responsive design | Works on mobile and desktop |

---

## Architecture

```
Browser (React + Vite)
    │
    │  POST /api/analyze  { message: "..." }
    ▼
Express backend (server.js, port 3001)
    ├── Deterministic rules layer  ← always runs
    │       8 pattern rules: advance payment, urgency, PII request,
    │       vague company, unofficial channel, high pay, no interview,
    │       generic greeting
    │
    ├── AI layer (optional)
    │       If OPENAI_API_KEY is set → calls gpt-4o-mini
    │       Returns structured JSON with findings, evidence, steps
    │       Falls back silently on error
    │
    └── Demo fallback
            Rule findings + safe defaults
            Clearly labelled demo: true in response
```

The frontend **never sees the API key**. All AI calls happen server-side only.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8 |
| Backend | Node.js 24, Express 5 |
| Styling | Pure CSS (no framework), dark navy cybersecurity theme |
| AI model | OpenAI GPT-4o-mini (optional) |
| Linting | Oxlint |
| Build | Vite |

No database, no authentication, no third-party UI library.

---

## Prerequisites

- Node.js 18+ (tested on v24)
- npm 9+
- Optional: OpenAI API key for full AI analysis

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/verilens-ai.git
cd verilens-ai

# 2. Install dependencies
npm install

# 3. (Optional) Configure AI
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...

# 4. Start the backend (Terminal 1)
node server.js
# Server running on http://localhost:3001

# 5. Start the frontend (Terminal 2)
npm run dev
# App running on http://localhost:5173
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | Enables full AI analysis via GPT-4o-mini. Without this, the app runs in rule-based demo mode. |
| `PORT` | No | Backend port (default: `3001`) |

**Never commit `.env` to version control.** The `.gitignore` excludes it.

---

## API Endpoints

### `GET /api/health`
Returns `{"status":"ok"}`. Used to verify the backend is running.

### `POST /api/analyze`
**Request body:**
```json
{ "message": "string (10–8000 characters)" }
```

**Response (demo mode):**
```json
{
  "assessment": "High Concern",
  "summary": "3 pattern(s) of concern detected...",
  "findings": [
    {
      "id": "advance_payment",
      "label": "Advance Payment Request",
      "severity": "high",
      "phrase": "pay a registration fee",
      "snippet": "…you must pay a registration fee of ₹2,500…",
      "why": "Legitimate employers never require upfront payment.",
      "unverified": "AI analysis unavailable in demo mode."
    }
  ],
  "missing_evidence": ["Official company website not mentioned", "..."],
  "verification_steps": ["Search MCA portal for company name", "..."],
  "disclaimer": "DEMO MODE — results are from rule-based pattern matching only.",
  "demo": true
}
```

**Error responses:**
- `400` — message missing, too short (<10 chars), or too long (>8000 chars)
- `500` — unexpected server error

---

## Demo Walkthrough

1. Open **http://localhost:5173**
2. Click **"Load sample"** to load a realistic suspicious internship offer
3. Click **"Analyze Message"** (or press Ctrl+Enter)
4. Review the **assessment card**, **warning signals** with quoted phrases, **missing evidence**, and **verification steps**
5. Note the amber "Demo Mode" banner — results are rule-based only
6. With `OPENAI_API_KEY` set, the banner disappears and GPT-4o-mini provides richer, context-aware analysis

---

## AI Integration Details

When `OPENAI_API_KEY` is configured:
- Backend calls `POST https://api.openai.com/v1/chat/completions`
- Model: `gpt-4o-mini`, temperature 0.2, `response_format: json_object`
- The model is instructed to cite exact phrases, distinguish observed from unknown, never invent data, and avoid claiming fraud without evidence
- Rule-based findings not covered by the AI are merged into the response
- `demo: false` is set only after a successful, parseable AI response

If the AI call fails (network error, bad JSON, empty response), the server logs the error and returns the rule-based fallback with `demo: true`. The user always gets a useful response.

---

## Limitations

- **No real-time web lookup** — the tool cannot verify company registrations, email domains, or URLs automatically
- **Demo mode only** without an OpenAI key — findings are pattern-based, not context-aware
- **English-only** — patterns are tuned for English text
- **No persistent storage** — messages are not saved or logged (privacy by design)
- **Not a legal or financial instrument** — results are educational signals, not proof of fraud

---

## Future Improvements

- Integrate IBM watsonx.ai for on-premises or regulated deployments
- Add multilingual support (Hindi, Tamil, Telugu) for broader Indian community reach
- Optional: MCA company registration lookup via official API
- Structured reporting export (PDF summary)
- Accessibility audit and screen-reader testing

---

## IBM Bob Usage

This project was built using **IBM Bob** (AI-powered IDE) as part of the hackathon. Bob was used to:
- Scaffold the full React + Vite + Express project structure
- Implement the deterministic rules engine and Express API
- Design and write the cybersecurity dashboard UI
- Write the OpenAI integration with structured output and fallback logic
- Generate this README and submission materials

---

## License

MIT

---

*Verilens AI · PS-03 AI for Communities, Access & Public Impact*
