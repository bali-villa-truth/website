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
    href: "/listing/2-units-villa-with-total-5-bedrooms-for-sale-freehold-in-pandawa-near-pandawa-beach-rf6636",
    label: "Pandawa 5-bed freehold audit",
    detail: "A high-yield example where price per bedroom and area rate assumptions matter.",
  },
  {
    href: "/listing/cozy-3-bedroom-villa-for-sale-leasehold-and-yearly-rent-in-kutuh-rf6460",
    label: "Kutuh 3-bed leasehold audit",
    detail: "Shows why lease years must be deducted before calling a deal attractive.",
  },
  {
    href: "/listing/3-bedroom-family-villa-for-sale-freehold-in-bali-nusa-dua-fm131",
    label: "Nusa Dua 3-bed family villa audit",
    detail: "A useful comparison for resort-market assumptions and lower-volatility demand.",
  },
  {
    href: "/listing/off-plan-elegant-affordable-3-bedroom-mediterranean-villas-for-sale-in-nusa-dua-rf9193",
    label: "Nusa Dua off-plan 3-bed audit",
    detail: "A good reminder to separate projected yield from construction and delivery risk.",
  },
  {
    href: "/listing/cozy-2-bedroom-apartment-for-sale-leasehold-in-bali-seminyak-ff021",
    label: "Seminyak 2-bed leasehold audit",
    detail: "Useful for checking mature-market pricing against true net cashflow.",
  },
];

const faqItems = [
  {
    q: "What is a realistic Bali villa ROI in 2026?",
    a: "A realistic target is usually 5% to 10% true net yield after management, platform fees, maintenance, vacancy, utilities, and lease decay. Some villas can exceed that, but every double-digit claim should be stress-tested against expenses, occupancy, and lease length.",
  },
  {
    q: "Why is net yield lower than agent ROI?",
    a: "Agent ROI often uses gross rental revenue divided by purchase price. Net yield subtracts the operating costs that actually come out of the owner's pocket, then subtracts annual lease depreciation for leasehold villas.",
  },
  {
    q: "Does leasehold reduce Bali villa ROI?",
    a: "Yes. A leasehold villa is a wasting asset unless the lease can be extended on known terms. If a villa costs $300,000 and has 20 years remaining, roughly $15,000 of value decays each year before rental profit is counted.",
  },
  {
    q: "Which Bali areas are best for ROI?",
    a: "There is no single best area. Canggu and Berawa offer deep demand but high prices. Uluwatu and Bingin can command high nightly rates but are more seasonal. Sanur and Nusa Dua can be steadier. The right answer depends on price, lease years, occupancy, and management quality.",
  },
  {
    q: "How should buyers use Bali Villa Truth before making an offer?",
    a: "Use the audit ledger to compare asking price, estimated net yield, price per square meter, lease years, flags, and comparable villas. Then verify property-level revenue, licenses, build quality, and lease documents with independent professionals before committing.",
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
      dateModified: "2026-05-13",
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
      "A practical guide to real Bali villa ROI: net yield, expenses, occupancy, lease decay, and due diligence before buying.",
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
                the only useful number is the cash left after occupancy risk,
                management fees, platform costs, maintenance, utilities, taxes, and
                leasehold decay. This guide shows how Bali Villa Truth stress-tests
                those assumptions across 2,000+ audited listings.
              </p>
            </div>
            <aside className="lg:col-span-4 border-t border-[color:var(--bvt-hairline)] pt-6">
              <div className="label-micro mb-5">Fast answer</div>
              <p className="text-[15px] leading-[1.7] text-[color:var(--bvt-ink-body)]">
                A credible Bali villa ROI target is usually 5% to 10% true net yield.
                Double-digit returns can exist, but only after the deal survives
                expense modeling, lease depreciation, realistic occupancy, and local
                due diligence.
              </p>
              <Link href="/#listings-section" className="inline-block mt-5 link-editorial text-[14px]">
                Browse audited villas
              </Link>
            </aside>
          </div>
        </header>

        <Section eyebrow="01 · Definition" title="Gross ROI is the easy number. Net yield is the honest one.">
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
            load, and then subtract annual lease depreciation for leasehold villas.
            That final number is divided by the asking price. It is intentionally
            conservative because the buyer carries the downside if the brochure is
            too optimistic.
          </p>
          <div className="border border-[color:var(--bvt-hairline)] rounded-md p-5 bg-[color:var(--bvt-bg-elev)]">
            <div className="label-micro mb-3">BVT net-yield formula</div>
            <p className="font-mono text-[13px] md:text-[14px] leading-relaxed text-[color:var(--bvt-ink)]">
              ((nightly rate x occupancy x 365) - 40% expenses - annual lease decay) / asking price
            </p>
          </div>
          <p>
            The full model is documented in the <InlineLink href="/methodology">BVT methodology</InlineLink>.
            The important thing is consistency: every listing is compared through
            the same lens, so a buyer can see which villas are genuinely attractive
            and which only look attractive because the inputs were soft.
          </p>
        </Section>

        <Section eyebrow="02 · Expenses" title="The silent leak is usually 35% to 45% of revenue.">
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
            discounting hit the account.
          </p>
        </Section>

        <Section eyebrow="03 · Leasehold" title="Lease decay can turn a good-looking villa into a mediocre deal.">
          <p>
            Many foreign buyers in Bali buy long leases rather than direct freehold
            title. A leasehold villa can still be a smart investment, but the math is
            different. If a villa costs $300,000 and has 20 lease years left, the
            asset is economically burning about $15,000 per year before rental profit
            is counted. Ignoring that decay makes short leases look far better than
            they are.
          </p>
          <p>
            Lease extensions can change the picture, but only when the extension
            terms are real, documented, and priced. A verbal "extendable" note should
            not be treated as cashflow. In BVT audits, leasehold depreciation is
            deducted every year so a 17-year lease is not compared casually with a
            freehold villa or a 35-year lease.
          </p>
          <p>
            This is one of BVT's clearest advantages over generic Bali villa ROI
            calculators. Lease decay is not cosmetic. It is central to the buyer's
            exit, refinancing options, resale value, and actual annual return.
            For the full tenure breakdown, read the{" "}
            <InlineLink href="/guides/bali-villa-leasehold-vs-freehold-roi">
              Bali villa leasehold vs freehold ROI guide
            </InlineLink>.
          </p>
        </Section>

        <Section eyebrow="04 · Occupancy" title="Location sets the ceiling, but assumptions decide the deal.">
          <p>
            Occupancy is the input that can make almost any spreadsheet look good.
            A villa that looks average at 55% occupancy can look excellent at 80%.
            The question is whether that occupancy is normal for the area, the
            micro-location, the villa quality, the rate, and the management plan.
          </p>
          <p>
            BVT estimates occupancy from area-level demand signals, including
            Booking.com review-density patterns. That is not the same as verified
            property-level booking history, and we say so. It is a market proxy for
            comparing listings at scale. Before closing, a buyer should still ask for
            owner statements, channel-manager exports, tax records where available,
            and the management contract behind any revenue claim.
          </p>
          <p>
            Area matters. <InlineLink href="/canggu">Canggu</InlineLink>,{" "}
            <InlineLink href="/berawa">Berawa</InlineLink>, and{" "}
            <InlineLink href="/pererenan">Pererenan</InlineLink> have deep rental
            demand but expensive entry prices. <InlineLink href="/uluwatu">Uluwatu</InlineLink>{" "}
            and <InlineLink href="/bingin">Bingin</InlineLink> can support premium
            nightly rates but carry more seasonality and off-plan risk.{" "}
            <InlineLink href="/seminyak">Seminyak</InlineLink> is mature and
            competitive. <InlineLink href="/sanur">Sanur</InlineLink>,{" "}
            <InlineLink href="/nusa-dua">Nusa Dua</InlineLink>,{" "}
            <InlineLink href="/ubud">Ubud</InlineLink>, and{" "}
            <InlineLink href="/ungasan">Ungasan</InlineLink> each have different
            demand curves. The right area is the one where the price, lease, rate,
            and buyer strategy line up.
          </p>
        </Section>

        <Section eyebrow="05 · Red flags" title="The best ROI pages tell you what could go wrong.">
          <p>
            A strong Bali villa ROI analysis should not be a cheerleader. It should
            be an argument against your own excitement. BVT flags short leases,
            off-plan listings, unusually low prices, missing data, unrealistic
            nightly-rate assumptions, and cases where yield appears to depend on
            everything going right.
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
              listings before treating the ROI as real.
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
                Example villa ROI audits.
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-3">
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
