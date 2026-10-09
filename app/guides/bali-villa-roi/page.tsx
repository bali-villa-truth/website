import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://balivillatruth.com";
const PAGE_URL = `${SITE_URL}/guides/bali-villa-roi`;

const areaLinks = [
  { href: "/canggu", label: "Canggu" },
  { href: "/berawa", label: "Berawa" },
  { href: "/pererenan", label: "Pererenan" },
  { href: "/uluwatu", label: "Uluwatu" },
  { href: "/bingin", label: "Bingin" },
  { href: "/seminyak", label: "Seminyak" },
  { href: "/ubud", label: "Ubud" },
  { href: "/sanur", label: "Sanur" },
  { href: "/ungasan", label: "Ungasan" },
  { href: "/nusa-dua", label: "Nusa Dua" },
];

const flagshipAudits = [
  {
    href: "/listing/charming-contemporary-3-bedroom-villa-for-sale-leasehold-and-rent-in-kutuh-ra016",
    label: "Kutuh 3-bed leasehold audit",
    detail: "Modeled villa: see how a noncash lease allowance changes the screening yield.",
  },
  {
    href: "/listing/3-bedroom-family-villa-for-sale-freehold-in-bali-nusa-dua-fm131",
    label: "Nusa Dua 3-bed family villa audit",
    detail: "Modeled villa: test the rate, occupancy, and cost assumptions before relying on the yield.",
  },
  {
    href: "/listing/off-plan-elegant-affordable-3-bedroom-mediterranean-villas-for-sale-in-nusa-dua-rf9193",
    label: "Nusa Dua off-plan 3-bed audit",
    detail: "Modeled scenario: construction and delivery risk are not priced into the yield.",
  },
  {
    href: "/listing/2-units-villa-with-total-5-bedrooms-for-sale-freehold-in-pandawa-near-pandawa-beach-rf6636",
    label: "Pandawa multi-unit audit",
    detail: "ROI not modeled: two units need verified unit-level economics before comparison.",
  },
  {
    href: "/listing/cozy-2-bedroom-apartment-for-sale-leasehold-in-bali-seminyak-ff021",
    label: "Seminyak apartment audit",
    detail: "ROI not modeled: the villa model does not cover this apartment.",
  },
];

const faqItems = [
  {
    q: "What is a realistic Bali villa ROI in 2026?",
    a: "There is no dependable market-wide ROI target. BVT's published yields are screening estimates under a shared 65% occupancy scenario, a 40% operating-cost assumption, and a lease-decay allowance where applicable. Verify actual booking revenue, costs, and tenure before treating any projected yield as achievable.",
  },
  {
    q: "Why is net yield lower than agent ROI?",
    a: "A gross ROI claim may divide projected rental revenue by the asking price without costs. BVT's modeled net yield instead deducts one pooled 40% operating-cost allowance and, for leasehold, a noncash lease-decay allowance. Neither deduction verifies an owner's actual bills or cash flow; ask for property records.",
  },
  {
    q: "Does leasehold reduce Bali villa ROI?",
    a: "BVT's modeled net yield deducts a noncash lease-value allowance for leaseholds. At a $300,000 audit price and a source-listed 20-year period, that allowance is $15,000 a year. It is not measured annual resale-value loss or a cash bill. Verify the signed remaining term and extension cost before underwriting.",
  },
  {
    q: "Which Bali areas are best for ROI?",
    a: "There is no verified best area in BVT's model. The shared 65% occupancy scenario does not rank area performance, and provisional review-density proxies are not booked nights. Compare asking price, lease terms, access, and property-level booking records for villas you can actually inspect.",
  },
  {
    q: "How should buyers use Bali Villa Truth before making an offer?",
    a: "Use the audit ledger to compare asking price, estimated net yield, price per square meter, source-listed lease years, flags, and similar asking listings. Then verify property-level revenue, licenses, build quality, and signed lease documents with independent professionals before committing.",
  },
];

const guideJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Bali Villa ROI", item: PAGE_URL },
      ],
    },
    {
      "@type": "Article",
      "@id": `${PAGE_URL}#article`,
      mainEntityOfPage: PAGE_URL,
      headline: "Bali Villa ROI: The 2026 Net Yield Guide for Buyers",
      description:
        "A buyer-focused guide to Bali villa ROI, net yield, occupancy, leasehold decay, management fees, and due diligence for villa investors.",
      image: `${SITE_URL}/og-image.png`,
      datePublished: "2026-05-13",
      dateModified: "2026-10-09",
      author: {
        "@type": "Organization",
        name: "Bali Villa Truth",
        url: SITE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: "Bali Villa Truth",
        url: SITE_URL,
      },
      articleSection: "Bali Villa Investment",
      keywords: [
        "bali villa roi",
        "bali villa investment",
        "bali property yield",
        "bali villa net yield",
        "bali villa management fees",
        "bali villa occupancy rates",
        "bali villa leasehold ROI",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ],
};

export const metadata: Metadata = {
  title: "Bali Villa ROI: 2026 Net Yield Guide for Buyers",
  description:
    "Bali villa ROI explained for buyers: gross vs net yield, occupancy, management fees, leasehold decay, red flags, and how to stress-test villa investment claims.",
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: "Bali Villa ROI: 2026 Net Yield Guide for Buyers",
    description:
      "A practical guide to modeled Bali villa ROI: net yield, expenses, occupancy, lease decay, and due diligence before buying.",
    url: PAGE_URL,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bali Villa ROI: 2026 Net Yield Guide for Buyers",
    description:
      "Stress-test Bali villa ROI claims before you buy. Net yield, management fees, occupancy, lease decay, and area risk.",
  },
};

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

function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="link-editorial">
      {children}
    </Link>
  );
}

export const revalidate = 86400;

export default function BaliVillaRoiGuidePage() {
  return (
    <main className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd) }}
      />

      <article className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-16">
        <nav className="mb-10 text-[12px]" aria-label="Breadcrumb">
          <Link href="/" className="text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors">
            Home
          </Link>
          <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
          <span className="text-[color:var(--bvt-ink)]">Bali villa ROI guide</span>
        </nav>

        <header className="mb-14 md:mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Buyer guide · 2026</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[58px] md:text-[74px] lg:text-[88px]">
                Bali villa ROI.
                <br />
                <span className="text-[color:var(--bvt-accent)]">Net yield, not brochure math.</span>
              </h1>
              <p className="mt-8 max-w-[68ch] text-[17px] md:text-[20px] leading-[1.62] text-[color:var(--bvt-ink-body)]">
                Bali villa ROI is not the number printed in a sales deck. For a buyer,
                a useful comparison starts with rental revenue after operating costs
                and a separate allowance for leasehold value erosion. This guide shows how Bali Villa Truth stress-tests
                those assumptions across 2,000+ audited listings.
              </p>
            </div>
            <aside className="lg:col-span-4 border-t border-[color:var(--bvt-hairline)] pt-6">
              <div className="label-micro mb-5">Fast answer</div>
              <p className="text-[15px] leading-[1.7] text-[color:var(--bvt-ink-body)]">
                There is no guaranteed Bali villa ROI target. BVT's figures compare
                listings under a shared 65% occupancy scenario, a 40% operating-cost
                load, and a lease-decay allowance where applicable. They are
                screening estimates, not a forecast of what a buyer will earn.
              </p>
              <Link href="/#listings-section" className="inline-block mt-5 link-editorial text-[14px]">
                Browse audited villas
              </Link>
            </aside>
          </div>
        </header>

        <Section eyebrow="01 · Definition" title="Gross yield starts the comparison. Net yield tests the costs.">
          <p>
            Most villa pitches begin with a headline return: 12%, 15%, sometimes
            20% or more. The problem is that the headline often uses gross rental
            revenue divided by purchase price. That can be useful as a rough first
            screen, but it is not the money an owner keeps. A villa still has to pay
            for management, cleaning, linen, utilities, repairs, platform fees,
            replacement furniture, slow months, taxes, licensing, and the ordinary
            messiness of running a hospitality asset in a tropical climate.
          </p>
          <p>
            Bali Villa Truth treats Bali villa ROI as a net-yield question. We start
            with estimated rental revenue, subtract a standard 40% operating expense
            load, and then subtract an annual lease-decay allowance for leasehold villas.
            That final number is divided by the auditor's USD purchase-price basis.
            Lease decay reduces the modeled economic yield; it is not a cash operating
            bill. The result is a comparable screening scenario, not realized profit.
          </p>
          <div className="border border-[color:var(--bvt-hairline)] rounded-md p-5 bg-[color:var(--bvt-bg-elev)]">
            <div className="label-micro mb-3">BVT net-yield formula</div>
            <p className="font-mono text-[13px] md:text-[14px] leading-relaxed text-[color:var(--bvt-ink)]">
              ((nightly rate x 65% occupancy x 365) x 60% after operating costs - annual lease-decay allowance) / audited USD price
            </p>
          </div>
          <p>
            The full model is documented in the <InlineLink href="/methodology">BVT methodology</InlineLink>.
            A consistent lens helps compare listings, but does not validate its inputs.
            The active August 2026 nightly-rate sample contains repeated result cards,
            so distinct-property coverage and some area-tier medians remain unverified.
            The October refresh was held, not applied to published yields. Ask for dated
            booking records and test lower-rate scenarios before an offer. Before
            moving from model to offer, run the{" "}
            <InlineLink href="/guides/bali-villa-due-diligence-checklist">
              Bali villa due diligence checklist
            </InlineLink>.
          </p>
        </Section>

        <Section eyebrow="02 · Expenses" title="Operating costs can erase the headline return.">
          <p>
            A villa can be booked often and still disappoint as an investment.
            Operating costs hit before profit arrives. Management commissions,
            booking-platform fees, cleaning, laundry, pool service, gardening,
            repairs, maintenance reserves, utilities, internet, staff, and local
            compliance all reduce the headline return. New buyers also tend to
            underestimate replacement cycles: outdoor furniture, soft goods, paint,
            pumps, air conditioning, and waterproofing all age quickly in Bali.
          </p>
          <p>
            BVT uses a 40% expense load as a standard audit assumption. It is not
            a claim that every villa costs exactly 40% to operate. It is a stress-test
            line that keeps comparisons honest. If a deal only works when expenses
            are assumed at 15% or 20%, the buyer should ask who is absorbing the
            missing work. If the answer is "you," then the yield is not passive.
          </p>
          <p>
            This is also why agent ROI and buyer ROI often disagree. Sales material
            is usually optimized to show upside. Buyer diligence has to model what
            happens after OTA fees, owner statements, maintenance calls, and low-season
            discounting hit the account. For a deeper operating-cost breakdown, read
            the{" "}
            <InlineLink href="/guides/bali-villa-management-fees">
              Bali villa management fees guide
            </InlineLink>.
          </p>
        </Section>

        <Section eyebrow="03 · Leasehold" title="How a listed lease period changes the modeled yield.">
          <p>
            A source listing may state a lease period without proving when the signed
            lease begins or expires. BVT uses that listed period as an illustrative
            denominator for its noncash lease-value allowance. At a $300,000 audit
            price and a listed 20-year period, the allowance is $15,000 per year in
            the screening model. That is not a measured annual fall in resale value,
            an owner payment, or proof that 20 years remain today.
          </p>
          <p>
            Documented extension rights and costs can change a buyer's own case; a
            verbal "extendable" note is not evidence of extra years or cash flow.
            Where a modeled leasehold has no source-listed period, BVT uses an
            illustrative 15-year denominator and flags the missing term. Compare
            any modeled result with the signed commencement date, expiry, and
            extension agreement before treating it as decision-grade.
          </p>
          <p>
            A finite lease can matter to a buyer's exit and financing options, but
            BVT's straight-line allowance does not predict either outcome or the
            property's actual annual return.
            For the full tenure breakdown, read the{" "}
            <InlineLink href="/guides/bali-villa-leasehold-vs-freehold-roi">
              Bali villa leasehold vs freehold ROI guide
            </InlineLink>.
          </p>
        </Section>

        <Section eyebrow="04 · Occupancy" title="Occupancy needs property-level evidence.">
          <p>
            Occupancy is the input that can make almost any spreadsheet look good.
            A villa that looks average at 55% occupancy can look excellent at 80%.
            The question is whether booking records support it for the specific
            villa, its rate, and its management plan.
          </p>
          <p>
            BVT uses the same 65% occupancy scenario for published yield comparisons;
            it does not claim that every villa will achieve 65% bookings. Separate
            area-level review-density figures are provisional demand proxies and do
            not drive the headline yield. Neither input is verified property-level
            booking history. Before closing, ask for owner statements, channel-manager
            exports, tax records where available, and the management contract behind
            any revenue claim.
            The full demand-input breakdown is in the{" "}
            <InlineLink href="/guides/bali-villa-occupancy-rates">
              Bali villa occupancy rates guide
            </InlineLink>.
          </p>
          <p>
            Compare listings in <InlineLink href="/canggu">Canggu</InlineLink>,{" "}
            <InlineLink href="/berawa">Berawa</InlineLink>,{" "}
            <InlineLink href="/pererenan">Pererenan</InlineLink>,{" "}
            <InlineLink href="/uluwatu">Uluwatu</InlineLink>,{" "}
            <InlineLink href="/bingin">Bingin</InlineLink>,{" "}
            <InlineLink href="/seminyak">Seminyak</InlineLink>,{" "}
            <InlineLink href="/sanur">Sanur</InlineLink>,{" "}
            <InlineLink href="/nusa-dua">Nusa Dua</InlineLink>,{" "}
            <InlineLink href="/ubud">Ubud</InlineLink>, and{" "}
            <InlineLink href="/ungasan">Ungasan</InlineLink> by price, tenure, and
            source detail. These area hubs are browsing paths, not verified
            rankings of occupancy, nightly rate, or investment safety.
          </p>
        </Section>

        <Section eyebrow="05 · Red flags" title="The best ROI pages tell you what could go wrong.">
          <p>
            A strong Bali villa ROI analysis should not be a cheerleader. It should
            be an argument against your own excitement. BVT flags short leases,
            off-plan listings, unusually low prices, and missing or unsupported
            data. The nightly-rate sample and shared occupancy scenario are model
            limitations even when a listing has no specific flag.
          </p>
          <p>
            Off-plan villas deserve special care. A render can show a finished
            hospitality asset, but the buyer is really underwriting construction,
            delivery timing, developer solvency, finish quality, permits, access,
            and whether the final product will actually photograph and review well.
            That risk should be separate from the rental-yield calculation.
          </p>
          <p>
            Price per square meter also matters. A villa can have an attractive
            projected yield and still be overpriced for the land, build quality, or
            remaining lease. The best buying decisions use multiple sanity checks:
            net yield, price per bedroom, price per square meter, comparable villas,
            lease years, management terms, and legal due diligence.
          </p>
        </Section>

        <Section eyebrow="06 · Workflow" title="How to use BVT before making an offer.">
          <ol className="space-y-4 list-decimal pl-5 marker:text-[color:var(--bvt-accent)] marker:font-mono">
            <li>
              Start with the <InlineLink href="/">Bali Villa Truth audit ledger</InlineLink>{" "}
              and filter by area, price, bedrooms, tenure, and net yield.
            </li>
            <li>
              Open the full audit page for any villa that looks interesting. Read
              the net-yield breakdown, sensitivity table, flags, and comparable
              listings before treating the estimate as evidence of owner returns.
            </li>
            <li>
              Compare nearby markets. A Canggu villa should be compared with Berawa
              and Pererenan; a Uluwatu villa should be checked against Bingin,
              Ungasan, and Nusa Dua where relevant.
            </li>
            <li>
              Ask the agent for actual rental history, channel data, management
              contract, utility costs, tax/licensing status, lease documents, and
              any extension terms in writing.
            </li>
            <li>
              Take the BVT number as a first-pass stress test, not a substitute for
              independent legal, tax, construction, and on-site diligence.
            </li>
          </ol>
          <p>
            The goal is not to find a spreadsheet that says yes. The goal is to know
            exactly which assumptions have to be true for the villa to be worth
            buying.
          </p>
        </Section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">Area hubs</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Compare ROI by location.
              </h2>
            </div>
            <div className="lg:col-span-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {areaLinks.map((area) => (
                  <Link
                    key={area.href}
                    href={area.href}
                    className="border border-[color:var(--bvt-hairline)] hover:border-[color:var(--bvt-accent)]/60 bg-[color:var(--bvt-bg-elev)] rounded-md p-4 transition-colors"
                  >
                    <span className="label-micro">Villa investment audits</span>
                    <span className="block mt-2 text-[17px] font-display text-[color:var(--bvt-ink)]">
                      {area.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">Live audits</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Example audit dossiers.
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-3">
              <p className="text-[15px] leading-[1.7] text-[color:var(--bvt-ink-body)]">
                The last two assets are outside BVT's villa ROI model. An unavailable
                yield is a model boundary, not a zero return.
              </p>
              {flagshipAudits.map((audit) => (
                <Link
                  key={audit.href}
                  href={audit.href}
                  className="block border border-[color:var(--bvt-hairline)] hover:border-[color:var(--bvt-accent)]/60 bg-[color:var(--bvt-bg-elev)] rounded-md p-5 transition-colors"
                >
                  <span className="block font-display text-[20px] text-[color:var(--bvt-ink)] leading-tight">
                    {audit.label}
                  </span>
                  <span className="block mt-2 text-[14px] leading-[1.6] text-[color:var(--bvt-ink-muted)]">
                    {audit.detail}
                  </span>
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
                Bali villa ROI questions buyers ask first.
              </h2>
            </div>
            <div className="lg:col-span-8 divide-y divide-[color:var(--bvt-hairline)] border-y border-[color:var(--bvt-hairline)]">
              {faqItems.map((item) => (
                <div key={item.q} className="py-6">
                  <h3 className="font-display text-[22px] leading-tight text-[color:var(--bvt-ink)]">
                    {item.q}
                  </h3>
                  <p className="mt-3 text-[15px] md:text-[16px] leading-[1.75] text-[color:var(--bvt-ink-body)]">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
