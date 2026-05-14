import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://balivillatruth.com";
const PAGE_URL = `${SITE_URL}/guides/bali-villa-management-fees`;

const costRows = [
  {
    label: "Property management",
    bvtModel: "15% of gross rental revenue",
    why: "Local guest operations, owner reporting, staff coordination, issue handling, cleaning oversight, and listing management.",
  },
  {
    label: "OTA and booking costs",
    bvtModel: "15% of gross rental revenue",
    why: "Platform commissions, payment costs, promotional discounts, channel management, and the reality that not every booking arrives direct.",
  },
  {
    label: "Maintenance, utilities, and reserve",
    bvtModel: "10% of gross rental revenue",
    why: "Pool, garden, AC, linens, internet, utilities, small repairs, repainting, replacement furniture, and tropical-climate wear.",
  },
];

const faqItems = [
  {
    q: "What management fee should Bali villa buyers assume?",
    a: "BVT does not claim one exact market fee for every property. For comparison, our stress test reserves 15% of gross rental revenue for management and operations oversight, then adds booking costs and maintenance reserve separately.",
  },
  {
    q: "Why does BVT use a 40% operating-cost load?",
    a: "The 40% load is a conservative standardization tool. It helps buyers compare listings after management, booking costs, maintenance, utilities, and replacement reserve instead of relying on gross revenue.",
  },
  {
    q: "Can a villa operate below 40% costs?",
    a: "Some villas may operate below the BVT stress-test load, especially with strong direct bookings or hands-on owner management. Buyers should still model the downside because underestimating costs is one of the easiest ways to overpay.",
  },
  {
    q: "Are taxes and legal costs included?",
    a: "BVT's public listing model is an investment screening model, not tax or legal advice. Buyers should separately verify tax, licensing, transfer, ownership, and compliance costs with qualified professionals.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Bali villa management fees", item: PAGE_URL },
      ],
    },
    {
      "@type": "Article",
      "@id": `${PAGE_URL}#article`,
      mainEntityOfPage: PAGE_URL,
      headline: "Bali Villa Management Fees and Operating Costs: Net Yield Guide",
      description:
        "A buyer-focused guide to Bali villa management fees, booking costs, maintenance reserve, utilities, and why BVT stress-tests net yield after a 40% operating-cost load.",
      image: `${SITE_URL}/og-image.png`,
      datePublished: "2026-05-14",
      dateModified: "2026-05-14",
      author: { "@type": "Organization", name: "Bali Villa Truth", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Bali Villa Truth", url: SITE_URL },
      articleSection: "Bali Villa Investment",
      keywords: [
        "bali villa management fees",
        "bali villa operating costs",
        "bali villa ROI",
        "bali villa net yield",
        "bali villa maintenance costs",
        "bali villa investment costs",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export const metadata: Metadata = {
  title: "Bali Villa Management Fees and Operating Costs",
  description:
    "Bali villa management fees and operating costs explained for investors: management, OTA commissions, maintenance, utilities, reserve, and net yield stress testing.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Bali Villa Management Fees and Operating Costs",
    description:
      "Why owner net yield is lower than brochure ROI, and how BVT models management, booking, maintenance, utility, and reserve costs.",
    url: PAGE_URL,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bali Villa Management Fees and Operating Costs",
    description:
      "Stress-test Bali villa ROI after management, booking costs, maintenance, utilities, and reserve.",
  },
};

export const revalidate = 86400;

function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="link-editorial">
      {children}
    </Link>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
        <div className="lg:col-span-4">
          <div className="label-micro mb-4">{eyebrow}</div>
          <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
            {title}
          </h2>
        </div>
        <div className="lg:col-span-8 space-y-5 text-[15px] md:text-[16px] leading-[1.75] text-[color:var(--bvt-ink-body)]">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function BaliVillaManagementFeesPage() {
  return (
    <main className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-16">
        <nav className="mb-10 text-[12px]" aria-label="Breadcrumb">
          <Link href="/" className="text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors">
            Home
          </Link>
          <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
          <span className="text-[color:var(--bvt-ink)]">Management fees</span>
        </nav>

        <header className="mb-14 md:mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Buyer guide · operating costs</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[58px] md:text-[74px] lg:text-[88px]">
                Bali villa management fees.
                <br />
                <span className="text-[color:var(--bvt-accent)]">The quiet cost behind net yield.</span>
              </h1>
              <p className="mt-8 max-w-[68ch] text-[17px] md:text-[20px] leading-[1.62] text-[color:var(--bvt-ink-body)]">
                Many Bali villa listings sell the dream with gross rental revenue.
                Investors live with net owner income. Management, booking costs,
                maintenance, utilities, staff coordination, and replacement reserve
                can turn a headline ROI into a much thinner return. BVT models that
                gap before calling a villa attractive.
              </p>
            </div>
            <aside className="lg:col-span-4 border-t border-[color:var(--bvt-hairline)] pt-6">
              <div className="label-micro mb-5">BVT stress test</div>
              <p className="font-mono text-[34px] leading-none text-[color:var(--bvt-ink)]">40%</p>
              <p className="mt-4 text-[15px] leading-[1.7] text-[color:var(--bvt-ink-body)]">
                BVT reserves 40% of gross rental revenue for operating costs in the
                public audit model. It is a standard comparison load, not a promise
                that every villa will cost exactly 40% to operate.
              </p>
            </aside>
          </div>
        </header>

        <Section eyebrow="01 · Gross vs net" title="A villa can be busy and still underperform.">
          <p>
            Gross ROI starts with rental revenue. Net yield asks what remains after
            the villa actually runs. A villa with high nightly rates still needs
            guest handling, cleaning, laundry, OTA fees, utilities, pool and garden
            care, maintenance, repairs, replacement furniture, owner reporting, and
            slow-month resilience.
          </p>
          <p>
            This is why the <InlineLink href="/guides/bali-villa-roi">Bali villa ROI guide</InlineLink>{" "}
            separates gross yield from stress-tested net yield. Gross yield can be
            useful as an early screen. It is not enough for an offer strategy.
          </p>
        </Section>

        <Section eyebrow="02 · The BVT load" title="The 40% expense load is a consistency rule.">
          <p>
            BVT uses a standardized 40% operating-cost load so buyers can compare
            listings through the same lens. The model currently reserves 15% for
            property management, 15% for OTA and booking costs, and 10% for
            maintenance, utilities, and reserve. The point is not to predict every
            invoice. The point is to stop an optimistic brochure from pretending the
            villa has no friction.
          </p>
          <div className="md:hidden space-y-3">
            {costRows.map((row) => (
              <div key={row.label} className="border border-[color:var(--bvt-hairline)] rounded-md bg-[color:var(--bvt-bg-elev)] p-4">
                <div className="label-micro mb-3">{row.label}</div>
                <div className="font-mono text-[14px] leading-relaxed text-[color:var(--bvt-accent)]">
                  {row.bvtModel}
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">
                  {row.why}
                </p>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto border border-[color:var(--bvt-hairline)] rounded-md">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[color:var(--bvt-bg-elev)] text-[color:var(--bvt-ink-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cost bucket</th>
                  <th className="px-4 py-3 font-semibold">BVT public model</th>
                  <th className="px-4 py-3 font-semibold">What it is trying to protect against</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--bvt-hairline)]">
                {costRows.map((row) => (
                  <tr key={row.label} className="align-top">
                    <td className="px-4 py-4 font-semibold text-[color:var(--bvt-ink)]">{row.label}</td>
                    <td className="px-4 py-4 font-mono text-[color:var(--bvt-accent)]">{row.bvtModel}</td>
                    <td className="px-4 py-4 text-[color:var(--bvt-ink-muted)] leading-relaxed">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            A buyer can replace those assumptions with property-specific numbers
            once the seller provides reliable evidence. Until then, a consistent
            stress test is safer than accepting a perfect-case expense line.
          </p>
        </Section>

        <Section eyebrow="03 · Questions to ask" title="Management cost is not just a percentage. It is an operating plan.">
          <p>
            Before relying on a lower cost assumption, ask who answers guests at
            night, who handles maintenance calls, who audits cleaning quality, who
            replaces linens, who watches OTA pricing, who reconciles owner payouts,
            and who pays when the AC fails in high season. A low management fee can
            be real, but only if the scope is equally clear.
          </p>
          <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)]">
            {[
              "What is included in the management fee, and what is billed separately?",
              "Are OTA commissions, card fees, discounts, and channel-manager costs included in the ROI claim?",
              "How much reserve is budgeted for furniture, repainting, pool equipment, waterproofing, and AC replacement?",
              "Who pays for staff, utilities, internet, laundry, cleaning supplies, and owner accounting?",
              "Can the seller provide full-year channel-manager exports and monthly owner statements?",
            ].map((item, index) => (
              <li key={item} className="py-4 flex gap-4">
                <span className="font-mono text-[11px] text-[color:var(--bvt-accent)] tabular-nums mt-1">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="04 · How to use it" title="Use expenses as a negotiation tool, not a footnote.">
          <p>
            If a seller's ROI claim only works with very low costs, ask for proof.
            If proof is weak, underwrite the villa with the BVT stress test and
            price the offer accordingly. When a villa still looks attractive after
            management, OTA costs, maintenance, utilities, and lease decay, the
            conversation becomes more serious.
          </p>
          <p>
            For leasehold assets, operating costs are only half of the adjustment.
            The other half is time. Read the{" "}
            <InlineLink href="/guides/bali-villa-leasehold-vs-freehold-roi">
              leasehold vs freehold ROI guide
            </InlineLink>{" "}
            and then run the{" "}
            <InlineLink href="/guides/bali-villa-due-diligence-checklist">
              due diligence checklist
            </InlineLink>{" "}
            before deposit or legal review.
          </p>
        </Section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">FAQ</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Common operating-cost questions.
              </h2>
            </div>
            <div className="lg:col-span-8 border-t border-[color:var(--bvt-hairline)]">
              {faqItems.map((item) => (
                <details key={item.q} className="group border-b border-[color:var(--bvt-hairline)] py-5">
                  <summary className="flex cursor-pointer items-start justify-between gap-6 list-none">
                    <span className="font-display text-[20px] md:text-[22px] leading-tight tracking-[-0.01em] text-[color:var(--bvt-ink)]">
                      {item.q}
                    </span>
                    <span className="shrink-0 mt-1 text-[color:var(--bvt-accent)] transition-transform group-open:rotate-45 font-mono text-[20px] leading-none select-none" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-[15px] leading-[1.65] text-[color:var(--bvt-ink-body)] max-w-[68ch]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
