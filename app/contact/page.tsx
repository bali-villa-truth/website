import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Bali Villa Truth",
  description:
    "Report a listing-data correction or enquire about an independent villa review. Bali Villa Truth is not a broker and does not sell villas or guarantee returns.",
  alternates: { canonical: "https://balivillatruth.com/contact" },
  openGraph: {
    title: "Contact Bali Villa Truth",
    description:
      "Listing corrections, independent review enquiries, and due-diligence questions.",
    url: "https://balivillatruth.com/contact",
  },
};

type ContactQuery = Record<string, string | string[] | undefined>;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<ContactQuery>;
}) {
  const query = await searchParams;
  const slug = typeof query.listing === "string" && query.listing.length <= 300 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(query.listing) ? query.listing : null;
  const listingUrl = slug ? `https://balivillatruth.com/listing/${slug}` : null;
  const reason = query.reason === "correction" || query.reason === "audit" ? query.reason : null;
  const reference = listingUrl || "[BVT or original listing URL]";
  const emailLink = (subject: string, body: string) =>
    `mailto:audits@balivillatruth.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const correctionEmail = emailLink(
    "BVT listing-data correction",
    `Listing reference: ${reference}\n\nField or assumption to review:\nCurrent BVT value:\nProposed correction:\nSupporting source URL or document:\nSource date:\nAdditional context:\n`,
  );
  const reviewEmail = emailLink(
    "BVT custom-review enquiry",
    `Listing reference: ${reference}\n\nQuestions to review:\nAsking price and currency:\nOwnership type and remaining lease term, if known:\nAvailable rental and operating-cost evidence:\nDecision timeline:\n`,
  );

  return (
    <div className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)]">
      <article className="max-w-[1100px] mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-16">
        <nav className="mb-8 text-[12px]" aria-label="Breadcrumb">
          <Link href="/" className="text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)]">Home</Link>
          <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
          <span className="text-[color:var(--bvt-ink)]">Contact</span>
        </nav>

        <header className="mb-10 max-w-[70ch]">
          <p className="label-micro mb-4">Independent investment research</p>
          <h1 className="font-display text-[color:var(--bvt-ink)] text-[36px] md:text-[48px] leading-[1.1] tracking-normal">
            Contact Bali Villa Truth
          </h1>
          <p className="mt-5 text-[17px] leading-[1.65]">
            Questions about a listing, its assumptions, or a possible data error?
            BVT provides independent ROI analysis. We are not a broker, do not
            sell villas, and do not guarantee investment returns.
          </p>
        </header>

        {listingUrl && (
          <section className="mb-10 border-y border-[color:var(--bvt-hairline)] py-5" aria-labelledby="listing-reference">
            <h2 id="listing-reference" className="label-micro mb-2">Listing reference</h2>
            <Link href={listingUrl} className="inline-flex max-w-full items-start gap-2 text-[13px] leading-relaxed text-[color:var(--bvt-accent)] underline underline-offset-4">
              <span className="min-w-0 [overflow-wrap:anywhere]">{listingUrl}</span>
              <ArrowUpRight className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            </Link>
            {reason && <p className="mt-2 text-[12px] text-[color:var(--bvt-ink-muted)]">
              Enquiry: {reason === "correction" ? "listing-data correction" : "custom review"}
            </p>}
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 mb-12">
          <section className="border-t border-[color:var(--bvt-hairline)] pt-6" aria-labelledby="correction-heading">
            <h2 id="correction-heading" className="font-display text-[26px] leading-tight text-[color:var(--bvt-ink)]">Report a data correction</h2>
            <p className="mt-4 text-[15px] leading-[1.65]">
              A changed asking price, incorrect property detail, or a misleading
              model assumption deserves a closer look. A correction report is
              evidence to review, not an automatic change to the audit.
            </p>
            <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)] list-disc pl-5">
              <li>The field or assumption in question</li>
              <li>A source URL or dated supporting document</li>
              <li>The corrected value and what changed</li>
            </ul>
            <a href={correctionEmail} className="mt-6 inline-flex items-center justify-center gap-2 min-h-11 px-4 py-3 text-[13px] font-medium bg-[color:var(--bvt-accent)] text-[color:var(--bvt-bg)] hover:bg-[color:var(--bvt-accent-warm)] transition-colors">
              <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />Email a correction
            </a>
          </section>

          <section className="border-t border-[color:var(--bvt-hairline)] pt-6" aria-labelledby="review-heading">
            <h2 id="review-heading" className="font-display text-[26px] leading-tight text-[color:var(--bvt-ink)]">Custom review enquiry</h2>
            <p className="mt-4 text-[15px] leading-[1.65]">
              Ask about a property-specific review of pricing, lease terms,
              rental evidence, costs, or downside scenarios. Scope, availability,
              any fee, and timing need confirmation before proceeding.
            </p>
            <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)] list-disc pl-5">
              <li>The listing and your decision questions</li>
              <li>Known lease terms and operating-cost evidence</li>
              <li>Your decision timeline and evidence gaps</li>
            </ul>
            <a href={reviewEmail} className="mt-6 inline-flex items-center justify-center gap-2 min-h-11 px-4 py-3 text-[13px] font-medium border border-[color:var(--bvt-hairline-2)] text-[color:var(--bvt-ink)] hover:border-[color:var(--bvt-accent)] transition-colors">
              <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />Enquire about a review
            </a>
          </section>
        </div>

        <section className="border-t border-[color:var(--bvt-hairline)] pt-6 mb-10">
          <h2 className="text-[15px] font-medium text-[color:var(--bvt-ink)]">General questions and feedback</h2>
          <a href="mailto:audits@balivillatruth.com" className="mt-2 inline-block max-w-full text-[14px] text-[color:var(--bvt-accent)] underline underline-offset-4 [overflow-wrap:anywhere]">audits@balivillatruth.com</a>
          <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">
            Response and review availability are not guaranteed. Do not include
            passports, bank details, or other sensitive personal documents in an initial enquiry.
          </p>
        </section>

        <section className="border-t border-[color:var(--bvt-hairline)] pt-6">
          <p className="text-[12px] leading-[1.65] text-[color:var(--bvt-ink-muted)] max-w-[80ch]">
            BVT analysis is informational, not financial, legal, tax, or
            investment advice. Independent legal and tax professionals should
            verify ownership, permissions, contracts, and tax treatment before
            any purchase. <Link href="/methodology" className="text-[color:var(--bvt-accent)] underline">Read the methodology</Link>
            {" or "}<Link href="/guides/bali-villa-due-diligence-checklist" className="text-[color:var(--bvt-accent)] underline">review the due-diligence checklist</Link>.
          </p>
        </section>
      </article>
    </div>
  );
}
