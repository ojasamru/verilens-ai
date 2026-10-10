import { useState } from 'react'
import './App.css'

const SAMPLE_MESSAGE = `Dear Candidate,

We are pleased to inform you that you have been SELECTED for a Work From Home Internship at Global Tech Solutions International Pvt. Ltd. — one of the most renowned and leading IT companies worldwide.

Position: Digital Marketing & Content Intern
Stipend: ₹35,000 per month
Duration: 3 months
Start Date: Immediate

You have been pre-selected based on your online profile. No interview is required.

To confirm your seat, you must pay a refundable security deposit of ₹2,500 via UPI within 24 hours. This amount will be returned along with your first stipend.

Please share your Aadhaar card, PAN card, and bank account details (with IFSC code) to proceed with onboarding.

For any queries, contact us on WhatsApp: +91-XXXXXXXXXX

Hurry — limited seats available! Don't miss this opportunity.

Regards,
HR Team
Global Tech Solutions International`

const SEVERITY_CONFIG = {
  high: { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  low: { label: 'Low', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
}

const ASSESSMENT_CONFIG = {
  'High Concern': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '⚠' },
  'Needs Verification': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⚡' },
  'Low Concern': { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: '✓' },
}

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="17" stroke="#22d3ee" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="10" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="18" cy="18" r="3.5" fill="#22d3ee" />
      <line x1="18" y1="1" x2="18" y2="8" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="28" x2="18" y2="35" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="18" x2="8" y2="18" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="18" x2="35" y2="18" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FindingCard({ finding }) {
  const sev = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.low
  return (
    <div className="finding-card" style={{ borderLeft: `3px solid ${sev.color}`, background: sev.bg }}>
      <div className="finding-header">
        <span className="finding-label">{finding.label}</span>
        <span className="severity-badge" style={{ color: sev.color, borderColor: sev.border, background: 'transparent' }}>
          {sev.label}
        </span>
      </div>
      {finding.snippet && (
        <blockquote className="finding-quote">"{finding.snippet}"</blockquote>
      )}
      <p className="finding-why"><strong>Why it matters:</strong> {finding.why}</p>
      {finding.unverified && (
        <p className="finding-unknown"><strong>Not yet verified:</strong> {finding.unverified}</p>
      )}
    </div>
  )
}

export default function App() {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function analyze() {
    const trimmed = message.trim()
    if (!trimmed) { setError('Please paste a message to analyze.'); return }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Server error')
      setResult(data)
    } catch (e) {
      setError(e.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function loadSample() {
    setMessage(SAMPLE_MESSAGE)
    setResult(null)
    setError(null)
  }

  function reset() {
    setMessage('')
    setResult(null)
    setError(null)
  }

  function handleKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyze()
  }

  const assessCfg = result ? (ASSESSMENT_CONFIG[result.assessment] || ASSESSMENT_CONFIG['Needs Verification']) : null

  return (
    <div className="shell">
      {/* Header */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <Logo />
            <div>
              <span className="brand-name">Verilens AI</span>
              <span className="brand-tag">See the signals. Understand the risk.</span>
            </div>
          </div>
          <span className="track-badge">PS-03 · AI for Communities</span>
        </div>
      </header>

      <main className="main">
        {/* Hero */}
        <section className="hero-section">
          <h1 className="hero-title">Is this message suspicious?</h1>
          <p className="hero-sub">
            Paste any suspicious internship offer, job ad, payment request, or digital message.
            Verilens AI identifies exact warning phrases, explains manipulation tactics, and recommends safe verification steps — without making claims it cannot prove.
          </p>
        </section>

        {/* Input card */}
        <section className="input-card">
          <div className="input-card-header">
            <label htmlFor="msg-input" className="input-label">Paste suspicious message</label>
            <button className="btn-sample" onClick={loadSample} type="button">Load sample</button>
          </div>
          <textarea
            id="msg-input"
            className="msg-textarea"
            placeholder="Paste the full text of the suspicious message here…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKey}
            rows={10}
            maxLength={8000}
            aria-label="Message to analyze"
          />
          <div className="input-footer">
            <span className="char-count">{message.length} / 8000 characters</span>
            <div className="input-actions">
              {message && <button className="btn-ghost" onClick={reset} type="button">Clear</button>}
              <button
                className="btn-primary"
                onClick={analyze}
                disabled={loading || !message.trim()}
                type="button"
                aria-busy={loading}
              >
                {loading ? <><span className="spinner" aria-hidden="true" /> Analyzing…</> : 'Analyze Message'}
              </button>
            </div>
          </div>
          <p className="keyboard-hint">Tip: Press Ctrl + Enter to analyze</p>
        </section>

        {/* Error */}
        {error && (
          <div className="alert-error" role="alert">
            <strong>Error: </strong>{error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="skeleton-wrap" aria-live="polite" aria-label="Analyzing message…">
            <div className="skeleton-bar w60" />
            <div className="skeleton-bar w40" />
            <div className="skeleton-bar w80" />
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <section className="results" aria-label="Analysis results">
            {/* Demo banner */}
            {result.demo && (
              <div className="demo-banner" role="status">
                <strong>Demo Mode</strong> — No AI model was used. Results are from rule-based pattern matching only.
                Set <code>OPENAI_API_KEY</code> in <code>.env</code> to enable full AI analysis.
              </div>
            )}

            {/* Assessment */}
            <div className="assessment-card" style={{ background: assessCfg.bg, borderColor: assessCfg.color }}>
              <span className="assess-icon" style={{ color: assessCfg.color }}>{assessCfg.icon}</span>
              <div>
                <div className="assess-label" style={{ color: assessCfg.color }}>{result.assessment}</div>
                <div className="assess-summary">{result.summary}</div>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="disclaimer">{result.disclaimer}</p>

            {/* Findings */}
            {result.findings?.length > 0 && (
              <div className="section-block">
                <h2 className="section-title">
                  <span className="section-icon">🔍</span>
                  Observed Warning Signals ({result.findings.length})
                </h2>
                <div className="findings-list">
                  {result.findings.map((f, i) => <FindingCard key={f.id || i} finding={f} />)}
                </div>
              </div>
            )}

            {/* Missing evidence */}
            {result.missing_evidence?.length > 0 && (
              <div className="section-block">
                <h2 className="section-title">
                  <span className="section-icon">?</span>
                  Missing Verification Evidence
                </h2>
                <ul className="evidence-list">
                  {result.missing_evidence.map((e, i) => (
                    <li key={i} className="evidence-item">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verification steps */}
            {result.verification_steps?.length > 0 && (
              <div className="section-block">
                <h2 className="section-title">
                  <span className="section-icon">✓</span>
                  Safe Verification Steps
                </h2>
                <ol className="steps-list">
                  {result.verification_steps.map((s, i) => (
                    <li key={i} className="step-item">{s}</li>
                  ))}
                </ol>
              </div>
            )}

            {result.findings?.length === 0 && (
              <div className="no-findings">
                No specific red-flag patterns were detected in the text. This does not confirm the message is safe.
              </div>
            )}
          </section>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon">🛡</div>
            <p>Your analysis will appear here.</p>
            <p className="empty-sub">Verilens AI highlights exact phrases, explains risks, and never claims more than the evidence supports.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        Verilens AI · PS-03 AI for Communities, Access &amp; Public Impact · Built with IBM Bob
      </footer>
    </div>
  )
}
