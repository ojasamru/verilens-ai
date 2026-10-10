# Building Verilens AI: An Evidence-First Scam Detection Tool — IBM Hackathon PS-03

## The Problem I Wanted to Solve

A friend almost lost money to a fake internship offer. The message looked completely legitimate — company letterhead style, professional language, a ₹35,000/month stipend. The only red flags were subtle: a request to pay a "refundable security deposit," a WhatsApp contact instead of an official email, and the fact that she was "selected without any interview."

She's not alone. According to multiple consumer reports, internship and job scams are one of the fastest-growing categories of online fraud in India, disproportionately targeting students and first-time job seekers who don't yet have a calibrated sense of what legitimate hiring looks like.

Existing tools give you a binary verdict: "SCAM" or "SAFE." But that's not how real-world judgment works. People need to understand *why* something is suspicious and *what to do* — not just a red circle emoji.

## What I Built

**Verilens AI** — See the signals. Understand the risk.

A web application where you paste any suspicious message and get back:

- Each **exact phrase** that triggered a concern, with surrounding context
- A plain-language explanation of **why that phrase matters**
- A list of **what's missing** from the message (things a legitimate offer would include)
- **Numbered verification steps** you can actually take
- An honest qualitative verdict: **Low Concern**, **Needs Verification**, or **High Concern**

And — critically — a clear statement that this is not proof of fraud. The tool is designed to inform judgment, not replace it.

## How It Works

The application uses a two-layer pipeline:

**Layer 1: Deterministic rules** (always runs)

Eight regex-based patterns covering the most common fraud signals:
- Advance payment or fee requests
- Artificial urgency ("within 24 hours", "limited seats")
- Requests for sensitive personal information (Aadhaar, PAN, bank details)
- Vague company descriptions ("global", "leading", "renowned")
- Unofficial communication channels (WhatsApp, Telegram)
- Unrealistically high compensation
- Selection without any interview or evaluation
- Generic impersonal greetings

Each rule extracts the matching phrase and a short snippet of surrounding context from the actual submitted text.

**Layer 2: AI analysis** (runs when `OPENAI_API_KEY` is configured)

The backend sends the message to GPT-4o-mini with a structured system prompt that instructs the model to:
- Cite only exact phrases from the submitted message
- Distinguish observed signals from unknowns
- Never invent company records, URLs, or statistics
- Never claim it has verified anything externally
- Return a strict JSON schema

The AI result is merged with rule-based findings not already covered. If the AI call fails for any reason, the system silently falls back to rule-based results — clearly labelled "Demo Mode."

**The API key never touches the frontend.** All AI calls are made server-side.

## The Tech Stack

- **React 19 + Vite 8** — frontend
- **Node.js 24 + Express 5** — backend
- **Pure CSS** — dark navy cybersecurity dashboard, no UI library
- **OpenAI GPT-4o-mini** — optional AI layer
- No database, no authentication, no third-party UI components

## How IBM Bob Helped

I used IBM Bob throughout the entire build:

1. **Project scaffolding** — Bob inspected the empty workspace, confirmed available runtimes (Node 24, npm 11), and chose the right stack without wasting time on unnecessary planning.

2. **Rules engine** — I described the fraud patterns I wanted to detect, and Bob implemented the full 8-rule regex engine with phrase extraction, snippet generation, and severity levels.

3. **Express backend** — Bob wrote the complete `server.js` including the `.env` parser, the OpenAI integration with structured output, the demo fallback, input validation, and error handling — in a single pass.

4. **React UI** — Bob designed and implemented the full cybersecurity dashboard: topbar with brand logo, textarea input with keyboard shortcuts, severity-coded finding cards with quoted phrases, numbered verification steps, loading skeleton, demo mode banner, and responsive mobile layout.

5. **Debugging** — When the Vite frontend needed to proxy API requests to the backend, Bob added the proxy config to `vite.config.js`. When I needed to verify the backend, Bob ran a minimal health check without restarting anything unnecessarily.

6. **Documentation** — Bob generated this blog post, the README, and the project abstract.

**Prompts I used (actual examples):**
- *"Run a quick, non-blocking backend check that starts the server in the background, waits briefly, requests its health endpoint, and prints the result."*
- *"Inspect the existing AI integration and make only the minimum changes needed to enable real AI analysis."*
- *"Finalize the project for submission. Do not rebuild anything. Create README, abstract, and ZIP."*

## Challenges

**Time pressure:** The hackathon window was tight. I had to make quick decisions about what to cut. OCR support, authentication, a database, and analytics were all dropped in favour of a polished, working core.

**Honest uncertainty:** The hardest design problem wasn't technical — it was deciding how the tool should handle its own limitations. I didn't want a tool that confidently calls things "SCAM" and is sometimes wrong. The entire output schema was designed around epistemic humility: observed signals, not verdicts.

**Demo mode transparency:** Without an API key, I had to ensure the tool was still genuinely useful but honest about what it couldn't do. The amber "Demo Mode" banner and the `unverified` field on each finding were deliberate choices.

## What I Learned

- A well-designed deterministic rules layer is often more reliable than an AI model for narrow, high-stakes pattern matching — and it's always available.
- Structured output schemas (`response_format: json_object`) make AI integration dramatically more reliable than open-ended text prompts.
- The most important design decision in a fraud detection tool is how you communicate uncertainty.
- IBM Bob is genuinely useful for rapid prototyping — not as a replacement for engineering judgment, but as a tool that removes the boring scaffolding so you can focus on the interesting decisions.

## Future Plans

- **IBM watsonx.ai integration** for regulated or enterprise deployments
- **Multilingual support** — Hindi, Tamil, Telugu (highest-risk communities for these scams)
- **MCA company lookup** via official government API
- **PDF report export** for sharing findings with family or authorities

## Try It

```bash
git clone https://github.com/<your-username>/verilens-ai.git
cd verilens-ai
npm install
node server.js          # Terminal 1
npm run dev             # Terminal 2
# Open http://localhost:5173
# Click "Load sample" → "Analyze Message"
```

No API key required for demo mode.

---

*Verilens AI was built for the IBM TechXchange Hackathon, Track PS-03: AI for Communities, Access & Public Impact.*
