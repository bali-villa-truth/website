import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://balivillatruth.com";
const PAGE_URL = `${SITE_URL}/guides/bali-villa-due-diligence-checklist`;

const checklist = [
  {
    group: "ROI math",
    items: [
      "Identify whether each quoted return is gross revenue, modeled net yield, or verified owner cash flow; BVT's badge is a screening estimate.",
      "Request dated property-level booked nights, realized nightly revenue, cancellations, and payout records; reconcile them to the claimed period.",
      "Test lower occupancy and nightly-rate scenarios against those records; BVT's published 65% occupancy is a shared assumption, not booked nights.",
      "Ask how any comparable nightly rates were selected and dated. BVT's August asking-rate sample has unverified distinct-property coverage.",
      "Replace BVT's pooled 40% cost allowance with property-specific management, platform, utility, upkeep, tax, and major-works evidence.",
    ],
  },
  {
    group: "Lease and ownership",
    items: [
      "Have independent qualified counsel verify the seller's title documents and the rights available under the buyer's proposed structure.",
      "For a leasehold, obtain the signed agreement and confirm the start date, end date, remaining years, and parties entitled to grant an extension.",
      "Ask counsel to review written extension terms and pricing; do not include an unpriced or informal extension in a base case.",
      "Separate BVT's noncash straight-line lease allowance from actual lease payments, operating bills, and any observed resale value.",
      "Confirm with independent legal and tax advisers whether the proposed holding structure, use, and transfer terms work for this buyer.",
    ],
  },
  {
    group: "Legal and permits",
    items: [
      "Ask independent counsel to check title, land-use classification, documented access, building approvals, and the permissions needed for the intended rental use.",
      "Compare the existing or proposed building with approved plans and permitted use; ask which deviations require a remedy.",
      "Request searches and documents for encumbrances, disputes, competing claims, boundaries, and access rights rather than relying on seller assurances.",
      "Have your own adviser review the sale or lease agreement, payment conditions, and remedies before any deposit or commitment.",
      "Obtain a written estimate of transaction costs and buyer-specific tax obligations; BVT's yield badge excludes them.",
    ],
  },
  {
    group: "Physical asset",
    items: [
      "Commission an independent condition inspection covering drainage, waterproofing, roof, pool, electrical, plumbing, cooling, and structural concerns.",
      "Price near-term repairs and replacement of furniture, linens, equipment, and appliances separately from routine operating costs.",
      "Visit the property and check access, parking, noise, nearby works, and drainage in conditions relevant to its use.",
      "For off-plan villas, review delivery milestones, payment protection, change orders, delay remedies, and the developer's completed projects.",
      "Get staffing, cleaning, utilities, and maintenance proposals that fit the intended service standard; do not assume the modeled nightly rate is achievable.",
    ],
  },
  {
    group: "Exit and downside",
    items: [
      "Ask for documented completed sales if available; do not treat current asking listings as achieved exit prices.",
      "For a leasehold, model the remaining term at a possible exit date and ask advisers about transfer restrictions and likely buyer requirements.",
      "Run a downside case with lower booked nights and rates, higher costs, a major repair, and a longer selling period.",
      "Calculate total acquisition cash required and the return under that downside case before deciding what, if anything, to offer.",
      "Keep personal-use value separate from rental income and resale assumptions; BVT does not price lifestyle benefits.",
    ],
  },
];

const faqItems = [
  {
    q: "What is the biggest red flag in a Bali villa listing?",
    a: "There is no universal biggest flag. A return claim without dated property-level revenue, cost, and tenure evidence deserves scrutiny. Ask whether it is gross, modeled net, or verified owner cash flow; BVT does not verify actual earnings.",
  },
  {
    q: "Is a flagged villa always a bad investment?",
    a: "No. A BVT flag is a prompt to investigate a source fact or model assumption, not a verdict. Fewer flags do not prove legal, physical, or financial safety; unresolved findings need independent review.",
  },
  {
    q: "Should buyers rely on agent occupancy numbers?",
    a: "Request dated property-level booking exports and payout records for a stated period. Review counts or area anecdotes do not verify occupied nights, and BVT's 65% yield scenario is an assumption rather than observed occupancy.",
  },
  {
    q: "Does BVT replace a lawyer or notaris?",
    a: "No. BVT is an investment-math and listing-audit tool. Legal structure, title, permits, tax, and contracts require independent professional advice in Indonesia.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Bali villa due diligence checklist", item: PAGE_URL },
      ],
    },
    {
      "@type": "Article",
      "@id": `${PAGE_URL}#article`,
      mainEntityOfPage: PAGE_URL,
      headline: "Bali Villa Due Diligence Checklist: 25 Evidence Checks for Buyers",
      description:
        "Twenty-five evidence requests for Bali villa buyers covering modeled ROI, lease terms, permissions, physical inspection, and downside scenarios.",
      image: `${SITE_URL}/og-image.png`,
      datePublished: "2026-05-13",
      dateModified: "2026-10-04",
      author: { "@type": "Organization", name: "Bali Villa Truth", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Bali Villa Truth", url: SITE_URL },
      articleSection: "Bali Villa Investment",
      keywords: [
        "bali villa due diligence",
        "bali villa red flags",
        "bali villa investment checklist",
        "bali villa ROI",
        "bali leasehold villa risk",
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
  title: "Bali Villa Due Diligence Checklist: 25 Evidence Checks",
  description:
    "Twenty-five Bali villa evidence checks for modeled ROI, lease terms, permissions, condition, operating costs, and downside risk.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Bali Villa Due Diligence Checklist: 25 Evidence Checks",
    description:
      "Ask for property-level records, independent reviews, and downside evidence before relying on a villa listing.",
    url: PAGE_URL,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bali Villa Due Diligence Checklist: 25 Evidence Checks",
    description:
      "Before buying a Bali villa, verify the math, lease, permits, legal structure, asset condition, and downside case.",
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

export default function BaliVillaDueDiligenceChecklistPage() {
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
          <span className="text-[color:var(--bvt-ink)]">Due diligence checklist</span>
        </nav>

        <header className="mb-14 md:mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Buyer guide · evidence checks</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[58px] md:text-[74px] lg:text-[88px]">
                Bali villa due diligence checklist.
                <br />
                <span className="text-[color:var(--bvt-accent)]">The evidence to request before you buy.</span>
              </h1>
              <p className="mt-8 max-w-[68ch] text-[17px] md:text-[20px] leading-[1.62] text-[color:var(--bvt-ink-body)]">
                A listing is a starting claim, not a completed diligence file.
                Request the records behind revenue, costs, rights, permissions,
                physical condition, and possible exit terms. Where evidence is
                missing, mark the conclusion unknown rather than filling it with
                an optimistic assumption.
              </p>
            </div>
            <aside className="lg:col-span-4 border-t border-[color:var(--bvt-hairline)] pt-6">
              <div className="label-micro mb-5">How BVT fits in</div>
              <p className="text-[15px] leading-[1.7] text-[color:var(--bvt-ink-body)]">
                BVT checks the investment math. It does not replace legal,
                technical, tax, or title diligence. Use the audit to decide what
                to verify, then use independent professionals before money moves.
              </p>
            </aside>
          </div>
        </header>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">01 · First pass</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Do not start with the seller's ROI. Start with the assumptions.
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-5 text-[15px] md:text-[16px] leading-[1.75] text-[color:var(--bvt-ink-body)]">
              <p>
                A headline ROI is not a bank statement. Ask whether a number is
                gross revenue, an owner's actual cash result, or a modeled scenario.
                BVT's badge uses shared occupancy and pooled operating-cost
                assumptions plus a noncash lease allowance where applicable. It
                excludes financing, tax, and major works; it does not establish
                what this villa has earned.
              </p>
              <p>
                On BVT, start with the <InlineLink href="/guides/bali-villa-roi">Bali villa ROI guide</InlineLink>,
                compare the listing against the <InlineLink href="/methodology">methodology</InlineLink>,
                and use this checklist for the questions a buyer should ask before
                offer, deposit, or legal review.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">02 · Checklist</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Twenty-five evidence checks for a real purchase decision.
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-6">
              {checklist.map((section, sectionIndex) => (
                <div key={section.group} className="border border-[color:var(--bvt-hairline)] rounded-md bg-[color:var(--bvt-bg-elev)] p-5">
                  <div className="label-micro mb-4">
                    {String(sectionIndex + 1).padStart(2, "0")} · {section.group}
                  </div>
                  <ul className="divide-y divide-[color:var(--bvt-hairline)]">
                    {section.items.map((item, itemIndex) => (
                      <li key={item} className="py-3 flex gap-4 text-[14px] md:text-[15px] leading-relaxed text-[color:var(--bvt-ink-body)]">
                        <span className="font-mono text-[11px] text-[color:var(--bvt-accent)] tabular-nums mt-1">
                          {String(itemIndex + 1).padStart(2, "0")}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">03 · Red flags</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Flags are questions, not safety ratings.
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-5 text-[15px] md:text-[16px] leading-[1.75] text-[color:var(--bvt-ink-body)]">
              <p>
                A short lease, off-plan status, or budget-rate adjustment calls
                for specific documents and an independent review. A flag does not
                establish that a deal is bad; absence of a flag does not establish
                that title, condition, bookings, or resale prospects are sound.
              </p>
              <p>
                Use the homepage risk shortcuts to find dossiers with fewer or
                more automated flags, then read each listing's missing-value and
                model-scope notes. Do not infer safety from a low flag count.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">04 · Next steps</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Take the next evidence step.
              </h2>
            </div>
            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
              {[
                { href: "/", label: "Browse the audit ledger", copy: "Filter by yield, tenure, price, and risk view." },
                { href: "/guides/bali-villa-roi", label: "Read the ROI guide", copy: "Understand gross yield, net yield, expenses, and occupancy." },
                { href: "/guides/bali-villa-leasehold-vs-freehold-roi", label: "Review lease terms", copy: "Separate the noncash model allowance from documented legal rights." },
                { href: "/guides/bali-villa-management-fees", label: "Check operating costs", copy: "Replace the pooled model allowance with property-level bills and contracts." },
                { href: "/guides/bali-villa-occupancy-rates", label: "Stress-test occupancy", copy: "Use dated booking records, not an area proxy, to assess occupied nights." },
                { href: "/contact", label: "Ask about a custom review", copy: "Send the listing and questions; scope and availability need confirmation." },
              ].map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="block border border-[color:var(--bvt-hairline)] hover:border-[color:var(--bvt-accent)]/60 rounded-md bg-[color:var(--bvt-bg-elev)] p-5 transition-colors"
                >
                  <div className="font-semibold text-[color:var(--bvt-ink)]">{card.label}</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">{card.copy}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">FAQ</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Common due diligence questions.
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
