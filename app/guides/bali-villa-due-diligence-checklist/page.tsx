import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://balivillatruth.com";
const PAGE_URL = `${SITE_URL}/guides/bali-villa-due-diligence-checklist`;

const checklist = [
  {
    group: "ROI math",
    items: [
      "Compare agent gross ROI with BVT net yield after operating costs.",
      "Ask for channel-manager exports, not screenshots or verbal revenue claims.",
      "Stress-test occupancy 10 to 15 points below the seller's assumption.",
      "Check whether nightly rates come from comparable villas in the same area and bedroom tier.",
      "Model management fees, OTA commissions, utilities, maintenance, replacement reserve, taxes, and vacancy.",
    ],
  },
  {
    group: "Lease and ownership",
    items: [
      "Confirm freehold, leasehold, or company ownership structure with an independent notaris.",
      "For leasehold, verify exact years remaining, extension rights, extension price, and who can grant the extension.",
      "Treat vague 'extendable' language as unpriced risk until it is written and reviewed.",
      "Model straight-line lease decay before calling the yield attractive.",
      "Check whether the buyer can legally use the proposed ownership structure.",
    ],
  },
  {
    group: "Legal and permits",
    items: [
      "Verify land certificate, zoning, access road, building approval, and rental licensing status.",
      "Check that the built villa matches the approved drawings and permitted use.",
      "Confirm there are no undisclosed liens, disputes, family claims, or boundary issues.",
      "Use independent counsel; do not rely only on the seller's lawyer, agent, or developer.",
      "Confirm tax obligations and transfer costs before agreeing to headline price.",
    ],
  },
  {
    group: "Physical asset",
    items: [
      "Inspect waterproofing, drainage, roof, pool shell, electrical, plumbing, AC, and structural condition.",
      "Budget for near-term capex if furniture, linens, pool equipment, or appliances are tired.",
      "Check access during rain, parking, noise, construction nearby, and neighbor constraints.",
      "For off-plan villas, verify developer track record, escrow mechanics, penalties, and staged-payment protections.",
      "Confirm the villa can be cleaned, staffed, and maintained to the nightly-rate level assumed in the model.",
    ],
  },
  {
    group: "Exit and downside",
    items: [
      "Ask who the likely resale buyer is and what comparable exits have actually achieved.",
      "Check whether the lease will still be financeable or attractive after five to ten years.",
      "Model a slower sale, lower occupancy, higher repair year, and weaker nightly rate before making an offer.",
      "Prefer a lower offer backed by evidence over a high yield that only works in the brochure case.",
      "Keep all investment decisions separate from lifestyle desire; both matter, but they are not the same math.",
    ],
  },
];

const faqItems = [
  {
    q: "What is the biggest red flag in a Bali villa listing?",
    a: "The biggest red flag is usually a return claim that does not separate gross revenue from true owner net income. Buyers should ask what costs were excluded and whether lease decay was modeled.",
  },
  {
    q: "Is a flagged villa always a bad investment?",
    a: "No. A flag means the assumption needs verification or pricing adjustment. A short lease, off-plan villa, or budget build can still be viable if the purchase price compensates for the risk.",
  },
  {
    q: "Should buyers rely on agent occupancy numbers?",
    a: "Only after seeing verifiable property-level data. Occupancy should be checked against channel-manager reports, booking calendars, reviews, and comparable villas in the same area.",
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
      headline: "Bali Villa Due Diligence Checklist: 25 Red Flags Before You Buy",
      description:
        "A practical due diligence checklist for Bali villa investors covering ROI math, leasehold risk, permits, legal review, physical inspection, and downside scenarios.",
      image: `${SITE_URL}/og-image.png`,
      datePublished: "2026-05-13",
      dateModified: "2026-05-13",
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
  title: "Bali Villa Due Diligence Checklist: 25 Red Flags",
  description:
    "Bali villa due diligence checklist for investors: ROI math, leasehold risk, permits, title, build quality, occupancy, management fees, and downside scenarios.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Bali Villa Due Diligence Checklist: 25 Red Flags",
    description:
      "A practical checklist for stress-testing Bali villa listings before deposits, legal review, and negotiation.",
    url: PAGE_URL,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bali Villa Due Diligence Checklist: 25 Red Flags",
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
            <span className="label-micro">Buyer guide · red flags</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[58px] md:text-[74px] lg:text-[88px]">
                Bali villa due diligence checklist.
                <br />
                <span className="text-[color:var(--bvt-accent)]">The red flags to verify before you buy.</span>
              </h1>
              <p className="mt-8 max-w-[68ch] text-[17px] md:text-[20px] leading-[1.62] text-[color:var(--bvt-ink-body)]">
                A good Bali villa investment can survive conservative assumptions.
                A weak one often depends on a perfect brochure: high occupancy,
                low costs, easy lease extension, no capex, and a clean exit. Use
                this checklist to separate the math worth investigating from the
                claims that need a lower offer or a hard no.
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
                The most common mistake in Bali villa investing is treating a
                headline ROI as if it were a bank statement. A seller may quote
                gross rental revenue, omit management fees, ignore OTA commissions,
                skip maintenance, assume high occupancy, and treat lease extension
                as automatic. Each omission makes the return look cleaner than it is.
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
                The 25 checks that keep optimistic listings honest.
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
                Flags are not verdicts. They are negotiation and diligence prompts.
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-5 text-[15px] md:text-[16px] leading-[1.75] text-[color:var(--bvt-ink-body)]">
              <p>
                A flagged villa can still be investable. The question is whether
                the price compensates for the risk. A short lease needs a lower
                price or written extension terms. An off-plan villa needs stronger
                developer protections. A budget build needs more capex reserve and
                a lower nightly-rate assumption.
              </p>
              <p>
                Use BVT's risk shortcuts on the homepage to compare the cleanest
                dossiers against the highest-risk ones. The gap often tells you
                more than a single listing page can.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">04 · Next steps</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Turn the checklist into an offer strategy.
              </h2>
            </div>
            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
              {[
                { href: "/", label: "Browse the audit ledger", copy: "Filter by yield, tenure, price, and risk view." },
                { href: "/guides/bali-villa-roi", label: "Read the ROI guide", copy: "Understand gross yield, net yield, expenses, and occupancy." },
                { href: "/guides/bali-villa-leasehold-vs-freehold-roi", label: "Model lease decay", copy: "See how ownership structure changes true return." },
                { href: "/guides/bali-villa-management-fees", label: "Check operating costs", copy: "Model management, booking, maintenance, utilities, and reserve before offer." },
                { href: "/contact", label: "Request a custom review", copy: "Use when a specific deal needs deeper human diligence." },
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
