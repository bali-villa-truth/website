'use client';

import { useState } from 'react';

/**
 * Listing page CTA block.
 *
 * Philosophy (2026-04-14): the BHI "source" link is public info — gating it
 * is a dishonest trade. We now show it openly. The email trade is for the
 * PDF audit (a take-with-you artifact for agent meetings), which is a real
 * convenience the user opts into AFTER reading the on-page audit.
 *
 * 2026-04-16: added share/copy link button (#19) and PDF preview (#10).
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

  const handleCopyLink = async () => {
    const url = `https://balivillatruth.com/listing/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback: select-prompt
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

      {/* Share / copy link — helps word-of-mouth (#19) */}
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

      {/* Email-me-this-audit block */}
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
            {/* PDF preview thumbnail (#10) — pure SVG, no network cost */}
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <div
                aria-hidden
                className="shrink-0 w-14 h-[72px] bg-white rounded shadow-inner overflow-hidden relative"
              >
                {/* Fake PDF page preview */}
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
                  3 pages · full math · 5-yr cashflow · sensitivity · agent questions
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
              {submitting ? 'Sending your audit...' : 'Email Me the PDF'}
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
    </div>
  );
}
