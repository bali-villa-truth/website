import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact — Bali Villa Truth",
  description:
    "Get in touch with Bali Villa Truth. Request a custom audit, ask a question, or share feedback. We reply within 48 hours — typically same-day.",
  alternates: { canonical: "https://balivillatruth.com/contact" },
  openGraph: {
    title: "Contact — Bali Villa Truth",
    description:
      "Get in touch. Custom audits, feedback, or due-diligence questions welcome.",
    url: "https://balivillatruth.com/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)]">
      <article className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-10 text-[12px]" aria-label="Breadcrumb">
          <Link href="/" className="text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors">
            Home
          </Link>
          <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
          <span className="text-[color:var(--bvt-ink)]">Contact</span>
        </nav>

        {/* Editorial hero */}
        <header className="mb-16 md:mb-24">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Letters to the editor</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[56px] md:text-[72px] lg:text-[84px]">
                Write to us.
              </h1>
              <p className="mt-8 max-w-[52ch] text-[19px] md:text-[21px] leading-[1.55] text-[color:var(--bvt-ink-body)]">
                We&apos;re a small, independent team. There&apos;s no sales
                funnel — just one email address that reaches us directly.
              </p>
            </div>
          </div>
        </header>

        {/* Email call-to-action — giant editorial address */}
        <section className="mb-20 md:mb-28 border-t border-b border-[color:var(--bvt-hairline)] py-14 md:py-20">
          <div className="label-micro mb-5">Email</div>
          <a
            href="mailto:audits@balivillatruth.com"
            className="group font-display text-[color:var(--bvt-accent)] hover:text-[color:var(--bvt-accent-warm)] text-[40px] sm:text-[56px] md:text-[72px] leading-[1.05] tracking-[-0.02em] break-all transition-colors"
          >
            audits@balivillatruth.com
            <span className="inline-block text-[color:var(--bvt-accent)] ml-3 transition-transform group-hover:translate-x-1" aria-hidden>↗</span>
          </a>
          <p className="mt-8 max-w-[60ch] text-[15px] leading-[1.65] text-[color:var(--bvt-ink-muted)]">
            We reply within 48 hours — usually same day, Bali time (UTC+8).
            Include a BHI listing URL if you want a quick second opinion on a
            specific property.
          </p>
        </section>

        {/* Two-column editorial rails */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-20 md:mb-28">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">Good reasons to write</span>
            </div>
            <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)]">
              {[
                "Audit a listing we haven't covered yet",
                "Second opinion before signing a lease",
                "Spotted an error in our data — please tell us",
                "Feature requests, feedback, partnership ideas",
              ].map((x, i) => (
                <li key={i} className="py-4 flex gap-4">
                  <span className="font-mono text-[11px] text-[color:var(--bvt-accent)] tabular-nums mt-1">0{i + 1}</span>
                  <span className="text-[15px] leading-[1.6] text-[color:var(--bvt-ink-body)]">{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-[color:var(--bvt-warn)]" aria-hidden />
              <span className="label-micro">What we can&apos;t do</span>
            </div>
            <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)]">
              {[
                "Legal or tax advice — talk to a notaris",
                "Introduce you to agents — we're not brokers",
                "Guarantee ROI — our numbers are estimates",
                "Respond to cold sales or SEO pitches",
              ].map((x, i) => (
                <li key={i} className="py-4 flex gap-4">
                  <span className="font-mono text-[11px] text-[color:var(--bvt-warn)] tabular-nums mt-1">0{i + 1}</span>
                  <span className="text-[15px] leading-[1.6] text-[color:var(--bvt-ink-body)]">{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Fine print */}
        <section className="pt-8 border-t border-[color:var(--bvt-hairline)]">
          <p className="text-[12px] leading-[1.65] text-[color:var(--bvt-ink-dim)] max-w-[70ch]">
            Our analysis is informational only and is not financial, legal, or
            investment advice. Always consult an independent Indonesian notaris
            and tax advisor before investing in Bali real estate.
          </p>
        </section>
      </article>
    </div>
  );
}
