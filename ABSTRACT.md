# Verilens AI — Project Abstract

**Hackathon Track:** PS-03 — AI for Communities, Access & Public Impact

**Tagline:** See the signals. Understand the risk.

## Problem

Every day, thousands of people — especially students and first-time job seekers — receive convincing-looking internship offers, job advertisements, and payment requests that are fraudulent. Existing tools either give a binary scam/not-scam verdict without explanation, or require technical literacy to use. The result: people either fall victim or dismiss legitimate opportunities out of excessive caution.

## Solution

Verilens AI is an evidence-first message analysis assistant. Users paste any suspicious message — an internship offer, a payment request, an email — and receive a structured breakdown of:

- **Exact warning phrases** from the message with inline quotes
- **Why each phrase is concerning** (advance payment demands, urgency manipulation, PII harvesting, impersonation patterns)
- **What information is missing** from the message that a legitimate offer would normally include
- **Safe, practical verification steps** tailored to the message
- **A qualitative assessment** (Low Concern / Needs Verification / High Concern)

The system explicitly distinguishes between observed evidence and unknowns, and never claims fraud without direct textual evidence.

## Technical Approach

The application uses a two-layer analysis pipeline:

1. **Deterministic rules layer** — eight regex-based rules covering the most common fraud patterns (advance payment, urgency, PII requests, vague company names, unofficial communication channels, unrealistic compensation, selection without interview, generic greetings). This layer always runs and provides reliable baseline detection.

2. **AI layer (optional)** — when an OpenAI API key is configured, the backend calls GPT-4o-mini with a structured prompt that instructs the model to cite exact phrases, avoid inventing data, and distinguish observed signals from unknowns. The AI result is merged with rule-based findings.

If no API key is available, or if the AI call fails, the system transparently falls back to the rule-based result, clearly labelling it as "Demo Mode."

## Architecture

- **Frontend:** React 19 + Vite 8, pure CSS cybersecurity dashboard
- **Backend:** Node.js 24 + Express 5, single-file server
- **AI:** OpenAI GPT-4o-mini via server-side fetch (key never exposed to browser)
- **No database, no login, no third-party UI library**

## Community Impact

Verilens AI directly addresses information asymmetry in employment fraud. It:
- Educates users about manipulation tactics rather than just blocking content
- Works in demo mode without any API key, making it freely deployable
- Preserves epistemic honesty — it never overstates certainty
- Is designed for first-generation internet users and students in India who are disproportionately targeted by internship scams

## Built With IBM Bob

IBM Bob (AI-powered IDE) was used throughout development for scaffolding, implementation, debugging, and documentation — demonstrating the capability of AI-assisted development tools for rapid, responsible product creation.
