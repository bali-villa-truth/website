'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BvtSeal } from '../../_components/BvtSeal';

/**
 * /deep-audit/success — landed here after Stripe hosted checkout.
 *
 * We read session_id from the URL, then POST it to /api/generate-deep-audit
 * which (a) verifies payment with Stripe, (b) generates the 5-page Deep Audit
 * PDF, (c) emails it via Resend, (d) records the sale in `paid_audits` for
 * idempotency. Page refreshes are safe — the API short-circuits if the same
 * session_id has already been sent.
 */
function DeepAuditSuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const [state, setState] = useState<'loading' | 'sent' | 'already_sent' | 'error'>('loading');
  const [email, setEmail] = useState<string>('');
  const [villaName, setVillaName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!sessionId) {
      setState('error');
      setErrorMsg('The checkout session is missing. If you completed a payment, contact hello@balivillatruth.com with your Stripe receipt.');
      return;
    }
    let canceled = false;
    (async () => {
      try {
        const res = await fetch('/api/generate-deep-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const json = await res.json();
        if (canceled) return;
        if (!res.ok) {
          setState('error');
          setErrorMsg(json.error || 'Something went wrong. Please contact hello@balivillatruth.com with your Stripe receipt.');
          return;
        }
        setEmail(json.email || '');
        setVillaName(json.villa_name || '');
        setState(json.status === 'already_sent' ? 'already_sent' : 'sent');
      } catch {
        if (canceled) return;
        setState('error');
        setErrorMsg('We could not verify the checkout session. If you completed a payment, email hello@balivillatruth.com with your Stripe receipt.');
      }
    })();
    return () => { canceled = true; };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink)] flex flex-col">
      <div className="max-w-[680px] w-full mx-auto px-6 py-16 md:py-24">
        <div className="flex items-center gap-3 mb-10">
          <BvtSeal size={42} showRingText={false} />
          <span className="font-display text-[22px] tracking-tight leading-none">Bali Villa Truth</span>
        </div>

        {state === 'loading' && (
          <>
            <h1 className="font-display text-[36px] md:text-[44px] leading-[1.1] tracking-[-0.02em]">
              Verifying checkout and preparing your Deep Audit…
            </h1>
            <p className="mt-4 text-[color:var(--bvt-ink-muted)] text-[15px] leading-relaxed">
              We&apos;re checking the payment status before generating the PDF. Please keep this page open while the request completes.
            </p>
            <div className="mt-8 flex items-center gap-3 text-[color:var(--bvt-ink-dim)] text-sm">
              <div className="h-[3px] w-24 bg-[color:var(--bvt-accent)] rounded-full animate-pulse" />
              <span>Working…</span>
            </div>
          </>
        )}

        {(state === 'sent' || state === 'already_sent') && (
          <>
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-[1.5px] text-[color:var(--bvt-accent)] uppercase mb-4">
              <span className="h-px w-8 bg-[color:var(--bvt-accent)]" />
              {state === 'already_sent' ? 'Already delivered' : 'Delivered'}
            </div>
            <h1 className="font-display text-[36px] md:text-[48px] leading-[1.05] tracking-[-0.02em]">
              Check your inbox{email ? ` — ${email}` : ''}.
            </h1>
            <p className="mt-5 text-[color:var(--bvt-ink-muted)] text-[16px] leading-relaxed max-w-[56ch]">
              {state === 'already_sent'
                ? `We've already sent the Deep Audit for ${villaName || 'this villa'} to your inbox. If you can't find it, check spam — and reply to that email to get a re-send.`
                : `Your Deep Audit for ${villaName || 'this villa'} was sent by email. Delivery time can vary; check your spam folder if needed.`}
            </p>

            <div className="mt-10 rounded-lg border border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg-soft,rgba(0,0,0,0.03))] p-6">
              <h2 className="font-display text-[18px] text-[color:var(--bvt-ink)] mb-3">
                Before you do anything else
              </h2>
              <ol className="space-y-2 text-[14px] leading-relaxed text-[color:var(--bvt-ink-muted)] list-decimal list-inside">
                <li>Review the assumptions and compare them with property-level rental records.</li>
                <li>Work through the due-diligence checklist before transferring any funds.</li>
                <li>Have independent local legal and survey professionals verify title, lease rights, permits, and physical condition.</li>
              </ol>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[color:var(--bvt-accent)] text-white text-sm font-semibold hover:bg-[color:var(--bvt-accent-hover,#e5a84d)] transition-colors"
              >
                ← Back to villa directory
              </Link>
              <a
                href="mailto:hello@balivillatruth.com"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-[color:var(--bvt-hairline)] text-[color:var(--bvt-ink)] text-sm font-semibold hover:border-[color:var(--bvt-accent)] transition-colors"
              >
                Questions? Reply to us
              </a>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="font-display text-[36px] md:text-[44px] leading-[1.1] tracking-[-0.02em]">
              Something went wrong generating your audit.
            </h1>
            <p className="mt-5 text-[color:var(--bvt-ink-muted)] text-[15px] leading-relaxed">
              {errorMsg}
            </p>
            <p className="mt-4 text-[color:var(--bvt-ink-muted)] text-[14px] leading-relaxed">
              We could not confirm payment or delivery from this page. If you completed a payment, email <a className="underline" href="mailto:hello@balivillatruth.com">hello@balivillatruth.com</a> with your Stripe receipt so the transaction can be checked.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function DeepAuditSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--bvt-bg)]" />}>
      <DeepAuditSuccessInner />
    </Suspense>
  );
}
