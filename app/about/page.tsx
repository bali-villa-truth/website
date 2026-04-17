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
    <div className="min-h-screen bg-[#0a1120] text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <nav className="text-xs text-slate-500 mb-8">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">About</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Why this <span className="text-[#d4943a]">exists</span>
        </h1>
        <p className="text-xl text-slate-400 leading-relaxed mb-10">
          Every villa listing in Bali quotes an ROI figure. Most of those
          figures wouldn&apos;t survive a junior analyst&apos;s first pass. So
          we built a site that does the pass for you.
        </p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">
              The problem
            </h2>
            <p>
              Bali&apos;s property market is brochure-driven. Agents publish
              yields of 15-25% using gross revenue, peak-season nightly rates,
              and purchase prices that conveniently exclude tax, notaris fees,
              furniture, and lease depreciation. Buyers — often first-time
              foreign investors — have no neutral place to check the math.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">
              What we do
            </h2>
            <p>
              We scrape every audited listing from Bali Home Immo, the largest
              single source of Bali villa inventory, and run each one through a
              standardized financial model:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Nightly rate benchmarked against AirDNA & booking platforms in the same area</li>
              <li>Area-specific occupancy assumptions (not a flat 85%)</li>
              <li>40% operating expense load — management, OTA commissions, maintenance, utilities</li>
              <li>Lease-term amortisation for all Hak Sewa (leasehold) properties</li>
              <li>Red-flag detection for short leases, price/rate mismatches, and inflated claims</li>
            </ul>
            <p className="mt-3">
              Everything is decomposable. Every number on every listing can be
              traced back to an input. Read the full{" "}
              <Link href="/methodology" className="text-[#d4943a] hover:underline">
                methodology page
              </Link>{" "}
              for the gory details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">
              How we stay honest
            </h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3">
              <div>
                <div className="text-sm font-bold text-slate-100">We&apos;re not a broker.</div>
                <p className="text-sm text-slate-400">
                  We earn zero commission on any sale. The &quot;view original
                  listing&quot; link goes straight to the agent — if you buy,
                  we don&apos;t see a rupiah.
                </p>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">We don&apos;t take agent money.</div>
                <p className="text-sm text-slate-400">
                  No paid rankings, no sponsored listings, no &quot;featured
                  properties.&quot; Every audit is run on the same model.
                </p>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">We show our assumptions.</div>
                <p className="text-sm text-slate-400">
                  Every sensitivity slider, every expense line item, every
                  lease-decay calculation is exposed. You can disagree with our
                  inputs and rebuild the math yourself.
                </p>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">We re-audit weekly.</div>
                <p className="text-sm text-slate-400">
                  Prices move. Flags change. Every listing shows its last
                  re-audit date, and we keep price history on file so you can
                  see which sellers are motivated.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">
              What we&apos;re not
            </h2>
            <p>
              We&apos;re not a law firm, a notaris, or a licensed financial
              advisor. Our analysis is informational. Every serious purchase
              still needs a contract review, a licensed notaris, and
              independent tax advice. If an audit here gives you pause —
              that&apos;s the point. If it gives you confidence — still do
              your own diligence.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-3">
              Who builds this
            </h2>
            <p>
              Bali Villa Truth is an independent project. The site,
              infrastructure, and audits are built and maintained by one person
              who splits time between Bali and the Australian east coast. The
              financial model is the work of a lapsed equities analyst who got
              tired of watching friends buy villas on the strength of a
              brochure.
            </p>
            <p className="mt-3">
              Questions, corrections, or audit requests:{" "}
              <a
                href="mailto:audits@balivillatruth.com"
                className="text-[#d4943a] hover:underline"
              >
                audits@balivillatruth.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">← Back to listings</Link>
          <span className="mx-3 text-slate-700">|</span>
          <Link href="/methodology" className="hover:text-slate-300">Methodology</Link>
          <span className="mx-3 text-slate-700">|</span>
          <Link href="/contact" className="hover:text-slate-300">Contact</Link>
        </div>
      </div>
    </div>
  );
}
