import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';

// Load .env manually (avoid dotenv import issue with ESM)
try {
  const env = readFileSync('.env', 'utf8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50kb' }));

// ─── Deterministic rules layer ───────────────────────────────────────────────
const RULES = [
  {
    id: 'advance_payment',
    pattern: /\b(pay|send|transfer|deposit|fee|charge|upfront|advance|registration fee|processing fee|refundable)\b/i,
    label: 'Advance Payment Request',
    why: 'Legitimate employers and programs never require payment to apply, receive a kit, or start work. Requests for upfront fees are a primary indicator of financial fraud.',
    severity: 'high',
  },
  {
    id: 'urgency',
    pattern: /\b(urgent|immediately|asap|within 24|today only|limited seats|act now|respond quickly|don'?t miss|last chance|expire|deadline today)\b/i,
    label: 'Artificial Urgency',
    why: 'Manufactured time pressure is used to prevent the target from researching or consulting others before complying.',
    severity: 'medium',
  },
  {
    id: 'personal_info',
    pattern: /\b(aadhaar|pan card|passport|bank account|account number|ifsc|routing number|social security|ssn|date of birth|mother'?s name|otp|pin|password|cvv)\b/i,
    label: 'Sensitive Information Request',
    why: 'Requests for government IDs, banking details, or authentication credentials through informal channels are a major red flag. Legitimate organisations collect such data through verified secure portals.',
    severity: 'high',
  },
  {
    id: 'vague_company',
    pattern: /\b(global|international|worldwide|renowned|leading|reputed|top|prestigious)\s+(company|firm|organization|organisation|agency|group|institute)\b/i,
    label: 'Vague Company Description',
    why: 'Fraudulent offers frequently claim affiliation with unnamed "global" or "leading" organisations without providing verifiable details.',
    severity: 'medium',
  },
  {
    id: 'suspicious_contact',
    pattern: /\b(whatsapp|telegram|signal|wechat|chat on|message me at|contact on)\b/i,
    label: 'Unofficial Communication Channel',
    why: 'Requests to move communication to personal messaging apps avoid audit trails and are inconsistent with standard professional hiring practices.',
    severity: 'medium',
  },
  {
    id: 'too_good',
    pattern: /\b(\d{4,}[k]?\s*(per\s*(month|week|day)|monthly|weekly|daily|\/ month|\/ week)|\bstipend\b.{0,30}\b\d{4,}\b|\bhigh[- ]paying\b|\blucrative\b|\bexceptional\s+pay\b)\b/i,
    label: 'Unusually High Compensation',
    why: 'Compensation that is disproportionate to the role or experience level is frequently used as bait. It does not confirm fraud but warrants verification.',
    severity: 'low',
  },
  {
    id: 'no_interview',
    pattern: /\b(no\s+interview|without\s+interview|selected\s+directly|directly\s+selected|pre[- ]selected|shortlisted\s+automatically|you\s+(have\s+been|are)\s+(selected|chosen|picked))\b/i,
    label: 'Selection Without Interview',
    why: 'Being selected without any evaluation process is unusual for legitimate roles and may indicate a fraudulent offer.',
    severity: 'high',
  },
  {
    id: 'generic_greeting',
    pattern: /\b(dear\s+(candidate|applicant|student|sir|ma'?am|friend)|hello\s+dear|hi\s+dear)\b/i,
    label: 'Generic / Impersonal Greeting',
    why: 'Mass-distributed fraudulent messages commonly use impersonal salutations because they are sent without knowing the recipient\'s name.',
    severity: 'low',
  },
];

function runRules(text) {
  const findings = [];
  for (const rule of RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      // Find a short snippet around the match
      const idx = text.toLowerCase().indexOf(match[0].toLowerCase());
      const start = Math.max(0, idx - 30);
      const end = Math.min(text.length, idx + match[0].length + 30);
      const snippet = (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
      findings.push({
        id: rule.id,
        label: rule.label,
        severity: rule.severity,
        phrase: match[0],
        snippet,
        why: rule.why,
      });
    }
  }
  return findings;
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────
async function analyzeWithOpenAI(message, ruleFindings) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are Verilens AI, a careful, evidence-first assistant that helps people assess suspicious messages.

Your job:
1. Identify specific phrases in the submitted message that are suspicious or concerning.
2. For each finding, cite the EXACT phrase from the message, explain why it matters, and note what is unverified.
3. Identify what important information is ABSENT from the message (e.g., no company registration number, no official email domain).
4. Provide 3-5 safe, practical verification steps.
5. Give an overall assessment: "Low Concern", "Needs Verification", or "High Concern".
6. Write a one-sentence summary.

Rules you MUST follow:
- Never claim a company or person is fraudulent without direct evidence in the text.
- Never invent URLs, company names, or statistics.
- Never claim you checked a website or verified a sender.
- Clearly distinguish what is observed in the text from what is unknown.
- Do not use arbitrary percentages.

Respond ONLY with valid JSON matching this exact schema:
{
  "assessment": "Low Concern" | "Needs Verification" | "High Concern",
  "summary": "string",
  "findings": [
    {
      "label": "string",
      "phrase": "exact phrase from message",
      "snippet": "short surrounding context",
      "severity": "high" | "medium" | "low",
      "why": "explanation",
      "unverified": "what is not known"
    }
  ],
  "missing_evidence": ["string"],
  "verification_steps": ["string"],
  "disclaimer": "string"
}`;

  const userPrompt = `Analyze this message for suspicious patterns:\n\n---\n${message}\n---\n\nRule-based findings already detected: ${JSON.stringify(ruleFindings.map(f => f.label))}`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1200,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from OpenAI');
  return JSON.parse(raw);
}

// ─── Demo fallback ────────────────────────────────────────────────────────────
function buildDemoResult(message, ruleFindings) {
  const highCount = ruleFindings.filter(f => f.severity === 'high').length;
  const medCount = ruleFindings.filter(f => f.severity === 'medium').length;

  let assessment = 'Low Concern';
  if (highCount >= 2 || (highCount >= 1 && medCount >= 1)) assessment = 'High Concern';
  else if (highCount >= 1 || medCount >= 2) assessment = 'Needs Verification';
  else if (medCount >= 1 || ruleFindings.length >= 2) assessment = 'Needs Verification';

  const findings = ruleFindings.map(f => ({
    ...f,
    unverified: 'AI analysis unavailable in demo mode. This finding is based on pattern matching only.',
  }));

  return {
    assessment,
    summary: ruleFindings.length === 0
      ? 'No obvious red-flag patterns were detected by the rule engine. This does not confirm the message is safe — manual verification is still recommended.'
      : `${ruleFindings.length} pattern(s) of concern detected. Key issues: ${ruleFindings.slice(0, 2).map(f => f.label).join(', ')}.`,
    findings,
    missing_evidence: [
      'Official company website or registration number not mentioned',
      'No verifiable contact email from a known domain',
      'No reference to a formal application process or portal',
      'No named interviewer or HR contact with verifiable credentials',
    ],
    verification_steps: [
      'Search for the company name on the Ministry of Corporate Affairs (MCA) portal or an equivalent official register.',
      'Look up the email domain — does it match the official company website exactly?',
      'Search "[company name] + scam" or "[company name] + reviews" online.',
      'Do not pay any fee or share personal documents before confirming the company is legitimate.',
      'Contact the company directly through their official website — not through any contact in this message.',
    ],
    disclaimer: 'DEMO MODE — No AI model was used. Results are from rule-based pattern matching only and are not a definitive assessment. Do not treat this as proof of fraud or safety.',
    demo: true,
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message field is required and must be a string.' });
  }

  const trimmed = message.trim();
  if (trimmed.length < 10) {
    return res.status(400).json({ error: 'Message is too short to analyze meaningfully.' });
  }
  if (trimmed.length > 8000) {
    return res.status(400).json({ error: 'Message exceeds the 8000-character limit.' });
  }

  const ruleFindings = runRules(trimmed);

  // Try AI
  try {
    const aiResult = await analyzeWithOpenAI(trimmed, ruleFindings);
    if (aiResult) {
      // Merge rule findings not already covered by AI
      const aiLabels = new Set((aiResult.findings || []).map(f => f.label.toLowerCase()));
      const extraFindings = ruleFindings.filter(f => !aiLabels.has(f.label.toLowerCase()));
      aiResult.findings = [...(aiResult.findings || []), ...extraFindings];
      aiResult.demo = false;
      aiResult.disclaimer = aiResult.disclaimer || 'This analysis is based on language patterns and AI reasoning. It is not a definitive determination of fraud. Always verify through official channels.';
      return res.json(aiResult);
    }
  } catch (err) {
    console.error('[AI error]', err.message);
  }

  // Demo fallback
  return res.json(buildDemoResult(trimmed, ruleFindings));
});

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Verilens server running on port ${PORT}`));
