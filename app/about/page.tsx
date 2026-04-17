import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Why Bali Villa Truth Exists",
  description:
    "Why an independent ROI audit site exists for Bali villa investors, who builds it, and how it stays honest. Our editorial principles and conflict-of-interest policy.",
  alternates: { canonical: "https://balivillatruth.com/about" },
  openGraph: {
    title: "About — Why Bali Villa Truth Exists",
    description:
      "An independent ROI audit for Bali villa investors — here's who builds it and why.",
    url: "https://balivillatruth.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)]">
      <article className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-10 text-[12px]" aria-label="Breadcrumb">
          <Link href="/" className="text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors">
            Home
          </Link>
          <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
          <span className="text-[color:var(--bvt-ink)]">About</span>
        </nav>

        {/* Editorial hero */}
        <header className="mb-20 md:mb-28">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Masthead · About the publication</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[56px] md:text-[72px] lg:text-[84px]">
                Why this
                <br />
                <span className="text-[color:var(--bvt-accent)]">exists.</span>
              </h1>
              <p className="mt-8 max-w-[58ch] text-[19px] md:text-[21px] leading-[1.55] text-[color:var(--bvt-ink-body)]">
                Every villa listing in Bali quotes an ROI figure. Most of those
                figures wouldn&apos;t survive a junior analyst&apos;s first pass.
                So we built a site that does the pass for you.
              </p>
            </div>
          </div>
        </header>

        {/* The problem + what we do — two-column editorial */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-20 md:mb-28">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">Section 01</span>
            </div>
            <h2 className="font-display text-[28px] md:text-[34px] leading-tight tracking-[-0.01em] text-[color:var(--bvt-ink)]">
              The problem
            </h2>
          </div>
          <div className="lg:col-span-8 lg:pt-2">
            <p className="text-[17px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[62ch]">
              Bali&apos;s property market is brochure-driven. Agents publish
              yields of 15–25% using gross revenue, peak-season nightly rates,
              and purchase prices that conveniently exclude tax, notaris fees,
              furniture, and lease depreciation. Buyers — often first-time
              foreign investors — have no neutral place to check the math.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-20 md:mb-28">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">Section 02</span>
            </div>
            <h2 className="font-display text-[28px] md:text-[34px] leading-tight tracking-[-0.01em] text-[color:var(--bvt-ink)]">
              What we do
            </h2>
          </div>
          <div className="lg:col-span-8 lg:pt-2">
            <p className="text-[17px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[62ch]">
              We scrape every listing from Bali Home Immo, the largest single
              source of Bali villa inventory, and run each one through a
              standardized financial model:
            </p>
            <ul className="mt-6 divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)] max-w-[62ch]">
              {[
                "Nightly rate benchmarked against AirDNA & booking platforms in the same area",
                "Area-specific occupancy assumptions — not a flat 85%",
                "40% operating expense load — management, OTA commissions, maintenance, utilities",
                "Lease-term amortisation for all Hak Sewa (leasehold) properties",
                "Red-flag detection for short leases, price/rate mismatches, and inflated claims",
              ].map((x, i) => (
                <li key={i} className="py-4 flex gap-4">
                  <span className="font-mono text-[11px] text-[color:var(--bvt-accent)] tabular-nums mt-1">
                    0{i + 1}
                  </span>
                  <span className="text-[15px] leading-[1.6] text-[color:var(--bvt-ink-body)]">{x}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[15px] leading-[1.6] text-[color:var(--bvt-ink-muted)] max-w-[62ch]">
              Everything is decomposable. Every number on every listing can be
              traced back to an input. Read the full{" "}
              <Link href="/methodology" className="link-editorial">
                methodology page
              </Link>{" "}
              for the gory details.
            </p>
          </div>
        </section>

        {/* How we stay honest — four principles, FT-style principle rail */}
        <section className="mb-20 md:mb-28">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Editorial principles</span>
          </div>
          <h2 className="font-display text-[36px] md:text-[48px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)] mb-10 md:mb-14">
            How we stay honest.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-y-14 md:gap-x-16">
            {[
              {
                n: "I.",
                t: "We're not a broker.",
                b: "We earn zero commission on any sale. The \"view original listing\" link goes straight to the agent — if you buy, we don't see a rupiah.",
              },
              {
                n: "II.",
                t: "We don't take agent money.",
                b: "No paid rankings, no sponsored listings, no \"featured properties.\" Every audit is run on the same model.",
              },
              {
                n: "III.",
                t: "We show our assumptions.",
                b: "Every sensitivity slider, every expense line item, every lease-decay calculation is exposed. You can disagree with our inputs and rebuild the math yourself.",
              },
              {
                n: "IV.",
                t: "We re-audit weekly.",
                b: "Prices move. Flags change. Every listing shows its last re-audit date, and we keep price history on file so you can see which sellers are motivated.",
              },
            ].map((p) => (
              <div key={p.n} className="border-t border-[color:var(--bvt-hairline)] pt-5">
                <div className="font-mono text-[13px] text-[color:var(--bvt-accent)] mb-3">{p.n}</div>
                <h3 className="font-display text-[22px] md:text-[24px] leading-tight tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-3">
                  {p.t}
                </h3>
                <p className="text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[50ch]">{p.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What we're not + who builds this */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-20 md:mb-28">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">Section 03</span>
            </div>
            <h2 className="font-display text-[28px] md:text-[34px] leading-tight tracking-[-0.01em] text-[color:var(--bvt-ink)]">
              What we&apos;re not
            </h2>
          </div>
          <div className="lg:col-span-8 lg:pt-2">
            <p className="text-[17px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[62ch]">
              We&apos;re not a law firm, a notaris, or a licensed financial
              advisor. Our analysis is informational. Every serious purchase
              still needs a contract review, a licensed notaris, and independent
              tax advice. If an audit here gives you pause — that&apos;s the
              point. If it gives you confidence — still do your own diligence.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">Colophon</span>
            </div>
            <h2 className="font-display text-[28px] md:text-[34px] leading-tight tracking-[-0.01em] text-[color:var(--bvt-ink)]">
              Who builds this
            </h2>
          </div>
          <div className="lg:col-span-8 lg:pt-2">
            <p className="text-[17px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[62ch]">
              Bali Villa Truth is an independent project. The site,
              infrastructure, and audits are built and maintained by one person
              who splits time between Bali and the Australian east coast. The
              financial model is the work of a lapsed equities analyst who got
              tired of watching friends buy villas on the strength of a
              brochure.
            </p>
            <p className="mt-4 text-[17px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[62ch]">
              Questions, corrections, or audit requests:{" "}
              <a
                href="mailto:audits@balivillatruth.com"
                className="link-editorial"
              >
                audits@balivillatruth.com
              </a>
              .
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}
