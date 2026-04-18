'use client';

import { useState } from 'react';

/**
 * Listing page CTA block.
 *
 * Philosophy (2026-04-14): the BHI "source" link is public info — gating it
 * is a dishonest trade. We show it openly. The email trade is for the free
 * 3-page PDF audit (a take-with-you artifact for agent meetings).
 *
 * 2026-04-17: added the Deep Audit upgrade — a paid $49 5-page PDF with
 * area comps, stress-test matrix, property-specific negotiation memo, exit
 * scenarios, and full DD checklist. Flow: POST email+villa_id to
 * /api/create-deep-audit-checkout, receive a Stripe hosted-checkout URL,
 * redirect. After payment, Stripe sends the user to /deep-audit/success
 * which calls /api/generate-deep-audit with the session_id to generate +
 * email the PDF (idempotent via Supabase paid_audits table).
 */
export default function ListingClient({
  sourceUrl,
  villaName,
  listingId,
  slug,
}: {
  sourceUrl: string;
  villaName: string;
  listingId: number;
  slug: string;
}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Deep-audit state — only becomes relevant after the user has already
  // received the free audit. We reuse the email field.
  const [deepSubmitting, setDeepSubmitting] = useState(false);
  const [deepError, setDeepError] = useState<string | null>(null);

  const handleEmailAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/unlock-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, villa_id: listingId }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again or refresh the page.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeepAudit = async () => {
    if (!email) {
      setDeepError('Enter your email above first.');
      return;
    }
    setDeepSubmitting(true);
    setDeepError(null);
    try {
      const res = await fetch('/api/create-deep-audit-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          villa_id: listingId,
          villa_name: villaName,
          slug,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Could not create checkout session');
      }
      window.location.href = json.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setDeepError(`${msg}. Email hello@balivillatruth.com if this persists.`);
      setDeepSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `https://balivillatruth.com/listing/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy this audit link:', url);
    }
  };

  // Mobile bottom-bar tap → scroll user to the CTA section + focus email.
  // On mobile the sidebar stacks at the very bottom of a long scroll, so the
  // Deep Audit was effectively hidden. The bottom bar is the entry point;
  // it doesn't try to be a self-contained form.
  const scrollToAuditCTA = () => {
    const el = document.getElementById('audit-email');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Slight delay so the focus ring lands after the smooth-scroll completes.
    setTimeout(() => el.focus({ preventScroll: true }), 650);
  };

  return (
    <div className="mt-4 space-y-2.5">
      {/* Always-visible source link — editorial ghost button */}
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full bg-transparent border border-[color:var(--bvt-hairline-2)] hover:border-[color:var(--bvt-accent)]/60 hover:bg-[color:var(--bvt-accent)]/5 text-[color:var(--bvt-ink)] text-[12px] font-semibold tracking-[0.14em] uppercase py-3 transition-colors"
      >
        View Original Listing →
      </a>

      {/* Share / copy link */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center justify-center gap-2 w-full bg-transparent border border-[color:var(--bvt-hairline)] hover:border-[color:var(--bvt-hairline-2)] text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] text-[11px] font-medium tracking-[0.12em] uppercase py-2.5 transition-colors"
        aria-live="polite"
      >
        {copied ? (
          <>
            <span className="text-[color:var(--bvt-good)]">✓</span> Link copied
          </>
        ) : (
          <>
            <span aria-hidden className="text-[color:var(--bvt-ink-faint)]">⎘</span> Copy audit link
          </>
        )}
      </button>

      {/* Email-me-this-audit block (free tier) */}
      <div className="mt-4 pt-4 border-t border-[color:var(--bvt-hairline)]">
        {sent ? (
          <div className="text-center py-2">
            <div className="text-[color:var(--bvt-good)] text-[13px] font-medium mb-1 tracking-wide">
              ✓ Audit on its way to {email}
            </div>
            <p className="text-[11px] text-[color:var(--bvt-ink-muted)] leading-relaxed">
              Check your inbox (and spam folder the first time). Arrives in under a minute.
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailAudit} className="space-y-2.5">
            <div>
              <p className="font-serif text-[15px] text-[color:var(--bvt-ink)] leading-tight tracking-tight">
                Email me this audit as a PDF
              </p>
              <p className="text-[10px] text-[color:var(--bvt-ink-muted)] leading-snug mt-0.5 tracking-wide">
                Free · 3 pages · full math · 5-yr cashflow · agent questions
              </p>
            </div>

            <input
              id="audit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              aria-label={`Email address for ${villaName} audit PDF`}
              className="w-full bg-[color:var(--bvt-bg-soft)] border border-[color:var(--bvt-hairline)] px-3 py-3 text-[13px] text-[color:var(--bvt-ink)] placeholder:text-[color:var(--bvt-ink-faint)] outline-none focus:border-[color:var(--bvt-accent)] transition-colors"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[color:var(--bvt-accent)] hover:bg-[color:var(--bvt-accent-warm)] text-[color:var(--bvt-bg)] text-[12px] font-semibold tracking-[0.14em] uppercase py-3.5 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending your audit…' : 'Email Me the Free Audit'}
            </button>
            {error && (
              <p className="text-[11px] text-[color:var(--bvt-bad)] text-center" role="alert">
                {error}
              </p>
            )}
            <p className="text-[10px] text-[color:var(--bvt-ink-muted)] text-center tracking-wide">
              One email. No newsletter spam.
            </p>
          </form>
        )}
      </div>

      {/* Deep Audit upgrade — always visible. Uses the same email field. */}
      <div className="mt-3 pt-4 border-t border-[color:var(--bvt-hairline)]">
        <div className="border border-[color:var(--bvt-accent)]/35 bg-[color:var(--bvt-accent)]/[0.04] p-4">
          <div className="flex items-center gap-2.5 mb-1.5">
            <p className="font-serif text-[17px] text-[color:var(--bvt-ink)] leading-tight tracking-tight">
              Deep Audit — $49
            </p>
            <span className="text-[9px] font-medium tracking-[0.18em] text-[color:var(--bvt-accent)] uppercase border border-[color:var(--bvt-accent)]/40 px-1.5 py-0.5">
              Pro
            </span>
          </div>
          <p className="text-[11px] text-[color:var(--bvt-ink-muted)] leading-snug mb-3">
            5 pages. Real comps · 6-scenario stress test · negotiation memo · exit scenarios · legal DD checklist.
          </p>

          <button
            type="button"
            onClick={handleDeepAudit}
            disabled={deepSubmitting}
            className="w-full bg-[color:var(--bvt-accent)] hover:bg-[color:var(--bvt-accent-warm)] text-[color:var(--bvt-bg)] text-[12px] font-semibold tracking-[0.14em] uppercase py-3 transition-colors disabled:opacity-50"
          >
            {deepSubmitting ? 'Redirecting to secure checkout…' : 'Upgrade to Deep Audit — $49 →'}
          </button>
          {deepError && (
            <p className="text-[11px] text-[color:var(--bvt-bad)] mt-2 text-center" role="alert">
              {deepError}
            </p>
          )}
          <p className="text-[10px] text-[color:var(--bvt-ink-muted)] text-center mt-2 tracking-wide">
            Stripe · Emailed in 30s · Not financial advice
          </p>
        </div>
      </div>

      {/* Mobile-only sticky bottom CTA bar. On mobile (<md) the sidebar stacks
          at the bottom of a long scroll, so the Deep Audit upgrade is hidden
          until the user scrolls past all audit content + comps + disclaimer.
          This bar follows the user. Tapping scrolls to the inline CTA and
          focuses the email field — keeps a single source of truth for state. */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[color:var(--bvt-bg-elev)]/95 backdrop-blur-md border-t border-[color:var(--bvt-hairline-2)] shadow-[0_-6px_24px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] tracking-[0.18em] uppercase text-[color:var(--bvt-accent)] font-semibold leading-none">
              Deep Audit · Pro
            </p>
            <p className="font-serif text-[15px] text-[color:var(--bvt-ink)] leading-tight mt-1 tracking-tight truncate">
              $49 · Full report in 30s
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToAuditCTA}
            className="shrink-0 bg-[color:var(--bvt-accent)] hover:bg-[color:var(--bvt-accent-warm)] text-[color:var(--bvt-bg)] text-[11px] font-semibold tracking-[0.14em] uppercase py-3 px-5 transition-colors"
            aria-label="Scroll to audit upgrade form"
          >
            Get it →
          </button>
        </div>
      </div>
    </div>
  );
}
