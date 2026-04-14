'use client';

import { useState } from 'react';

/**
 * Listing page CTA block.
 *
 * Philosophy (2026-04-14): the BHI "source" link is public info — gating it
 * is a dishonest trade. We now show it openly. The email trade is for the
 * PDF audit (a take-with-you artifact for agent meetings), which is a real
 * convenience the user opts into AFTER reading the on-page audit.
 */
export default function ListingClient({
  sourceUrl,
  villaName,
  listingId,
}: {
  sourceUrl: string;
  villaName: string;
  listingId: number;
}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                📧 Email me this audit as a PDF
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                3-page PDF with the full math, 5-year cashflow projection, sensitivity analysis,
                and a question list to take to the agent. Great for negotiation prep.
              </p>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
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
