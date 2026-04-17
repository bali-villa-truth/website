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

  return (
    <div className="mt-6 space-y-5">
      {/* Always-visible source link — no email gate */}
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-3 rounded-lg transition-colors"
      >
        View Original Listing →
      </a>
      <p className="text-xs text-slate-500 text-center -mt-3">
        Opens on Bali Home Immo. We don&apos;t earn anything if you book — we&apos;re just the auditor.
      </p>

      {/* Share / copy link — helps word-of-mouth */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 text-sm font-medium py-2.5 rounded-lg transition-colors"
        aria-live="polite"
      >
        {copied ? (
          <>
            <span className="text-emerald-400">✓</span> Link copied
          </>
        ) : (
          <>
            <span aria-hidden>🔗</span> Copy audit link to share
          </>
        )}
      </button>

      {/* Email-me-this-audit block (free tier) */}
      <div className="mt-6 pt-5 border-t border-slate-700">
        {sent ? (
          <div className="text-center py-2">
            <div className="text-emerald-400 text-sm font-semibold mb-1">
              ✓ Audit on its way to {email}
            </div>
            <p className="text-xs text-slate-500">
              Check your inbox (and spam folder the first time). Arrives in under a minute.
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailAudit} className="space-y-3">
            {/* PDF preview thumbnail — pure SVG, no network cost */}
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <div
                aria-hidden
                className="shrink-0 w-14 h-[72px] bg-white rounded shadow-inner overflow-hidden relative"
              >
                <div className="absolute inset-0 p-1.5 flex flex-col gap-1">
                  <div className="h-1.5 w-8 bg-[#d4943a] rounded-sm" />
                  <div className="h-1 w-full bg-slate-300 rounded-sm" />
                  <div className="h-1 w-[85%] bg-slate-300 rounded-sm" />
                  <div className="h-1 w-[70%] bg-slate-300 rounded-sm" />
                  <div className="mt-0.5 h-3 w-full bg-slate-200 rounded-sm grid grid-cols-3 gap-px p-0.5">
                    <div className="bg-emerald-400/60 rounded-[1px]" />
                    <div className="bg-amber-400/60 rounded-[1px]" />
                    <div className="bg-rose-400/60 rounded-[1px]" />
                  </div>
                  <div className="h-1 w-[90%] bg-slate-300 rounded-sm mt-0.5" />
                  <div className="h-1 w-[60%] bg-slate-300 rounded-sm" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 leading-tight">
                  📧 Email me this audit as a PDF
                </p>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  Free · 3 pages · full math · 5-yr cashflow · sensitivity · agent questions
                </p>
              </div>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              aria-label={`Email address for ${villaName} audit PDF`}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-[#d4943a] transition-colors"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#d4943a] hover:bg-[#e5a84d] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Sending your audit...' : 'Email Me the Free Audit'}
            </button>
            {error && (
              <p className="text-xs text-red-400 text-center" role="alert">
                {error}
              </p>
            )}
            <p className="text-[10px] text-slate-500 text-center">
              One email. No newsletter spam.
            </p>
          </form>
        )}
      </div>

      {/* Deep Audit upgrade — always visible. Uses the same email field. */}
      <div className="mt-4 pt-5 border-t border-slate-700">
        <div className="rounded-lg border border-[#d4943a]/40 bg-gradient-to-br from-[#3a2a13]/40 to-slate-900/60 p-4">
          <div className="flex items-start gap-3 mb-3">
            <div
              aria-hidden
              className="shrink-0 w-14 h-[72px] bg-[#fbf6ec] rounded shadow-inner overflow-hidden relative"
            >
              <div className="absolute inset-0 p-1.5 flex flex-col gap-1">
                <div className="h-1.5 w-10 bg-[#d4943a] rounded-sm" />
                <div className="h-1 w-full bg-slate-400/60 rounded-sm" />
                <div className="h-1 w-[85%] bg-slate-400/60 rounded-sm" />
                <div className="mt-0.5 h-5 w-full bg-slate-200 rounded-sm grid grid-cols-6 gap-px p-0.5">
                  <div className="bg-emerald-500/50 rounded-[1px]" />
                  <div className="bg-amber-500/50 rounded-[1px]" />
                  <div className="bg-amber-500/50 rounded-[1px]" />
                  <div className="bg-rose-500/50 rounded-[1px]" />
                  <div className="bg-rose-500/50 rounded-[1px]" />
                  <div className="bg-emerald-500/50 rounded-[1px]" />
                </div>
                <div className="h-1 w-[90%] bg-slate-400/60 rounded-sm mt-0.5" />
                <div className="h-1 w-[70%] bg-slate-400/60 rounded-sm" />
                <div className="h-1 w-[60%] bg-slate-400/60 rounded-sm" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#f5e7cf] leading-tight">
                  Deep Audit — $49
                </p>
                <span className="text-[10px] font-mono tracking-[1px] text-[#d4943a] uppercase border border-[#d4943a]/40 rounded px-1.5 py-0.5">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug mt-1">
                5 pages. Real area comps · 6-scenario stress test · property-specific negotiation memo · exit scenarios · legal DD checklist.
              </p>
            </div>
          </div>

          <ul className="space-y-1.5 text-[12px] text-slate-300 mb-4 pl-1">
            <li className="flex gap-2"><span className="text-[#d4943a]">▸</span><span>Top 5 comparable listings with actual names, prices, and yields</span></li>
            <li className="flex gap-2"><span className="text-[#d4943a]">▸</span><span>Worst/base/bull case yield — including double-shock cost inflation</span></li>
            <li className="flex gap-2"><span className="text-[#d4943a]">▸</span><span>Negotiation memo tailored to this property&apos;s flags and price gap</span></li>
            <li className="flex gap-2"><span className="text-[#d4943a]">▸</span><span>25-item due diligence checklist (Notaris, surveyor, legal)</span></li>
          </ul>

          <button
            type="button"
            onClick={handleDeepAudit}
            disabled={deepSubmitting}
            className="w-full bg-[#d4943a] hover:bg-[#e5a84d] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 text-sm"
          >
            {deepSubmitting ? 'Redirecting to secure checkout…' : 'Upgrade to Deep Audit — $49 →'}
          </button>
          {deepError && (
            <p className="text-xs text-red-400 mt-2 text-center" role="alert">
              {deepError}
            </p>
          )}
          <p className="text-[10px] text-slate-500 text-center mt-2">
            Payment by Stripe. Emailed within 30 seconds. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
