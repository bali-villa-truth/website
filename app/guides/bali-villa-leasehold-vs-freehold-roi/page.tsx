import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://balivillatruth.com";
const PAGE_URL = `${SITE_URL}/guides/bali-villa-leasehold-vs-freehold-roi`;

const faqItems = [
  {
    q: "Is leasehold or freehold better for Bali villa ROI?",
    a: "Neither is automatically better. Leasehold can produce a stronger cash-on-cash yield when the entry price is low enough, but the remaining lease must be depreciated each year. Freehold usually costs more upfront but may preserve resale value better.",
  },
  {
    q: "How does lease decay affect ROI?",
    a: "Lease decay is the annual loss of economic value as the lease runs down. If a leasehold villa costs $300,000 and has 20 years left, a simple straight-line model treats about $15,000 per year as value decay before rental profit is counted.",
  },
  {
    q: "Should buyers trust extendable lease claims?",
    a: "Only if the extension terms are written, priced, legally reviewed, and tied to the right parties. A vague 'extendable' note should not be treated as guaranteed value in an ROI calculation.",
  },
  {
    q: "Can foreigners own freehold property in Bali?",
    a: "Foreign ownership structures in Indonesia are legal and tax questions that need professional advice. BVT does not give legal advice; it models the investment math buyers should stress-test before relying on any structure.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Bali villa leasehold vs freehold ROI", item: PAGE_URL },
      ],
    },
    {
      "@type": "Article",
      "@id": `${PAGE_URL}#article`,
      mainEntityOfPage: PAGE_URL,
      headline: "Bali Villa Leasehold vs Freehold ROI: The Real Yield Impact",
      description:
        "A buyer-focused guide to how Bali villa leasehold and freehold structures affect ROI, net yield, depreciation, resale risk, and due diligence.",
      image: `${SITE_URL}/og-image.png`,
      datePublished: "2026-05-13",
      dateModified: "2026-05-13",
      author: { "@type": "Organization", name: "Bali Villa Truth", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Bali Villa Truth", url: SITE_URL },
      articleSection: "Bali Villa Investment",
      keywords: [
        "bali villa leasehold vs freehold ROI",
        "bali villa ROI",
        "bali leasehold villa investment",
        "bali freehold villa investment",
        "bali villa lease decay",
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
  title: "Bali Villa Leasehold vs Freehold ROI — Real Yield Impact",
  description:
    "Bali villa leasehold vs freehold ROI explained: lease decay, net yield, resale risk, extension terms, and buyer due diligence before investing.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Bali Villa Leasehold vs Freehold ROI — Real Yield Impact",
    description:
      "How leasehold and freehold structures change Bali villa ROI, net yield, depreciation, and resale risk.",
    url: PAGE_URL,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bali Villa Leasehold vs Freehold ROI — Real Yield Impact",
    description:
      "Stress-test Bali villa leasehold and freehold returns before you buy.",
  },
};

export const revalidate = 86400;

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

export default function LeaseholdVsFreeholdRoiPage() {
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
          <span className="text-[color:var(--bvt-ink)]">Leasehold vs freehold ROI</span>
        </nav>

        <header className="mb-14 md:mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Buyer guide · ROI structure</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[58px] md:text-[74px] lg:text-[88px]">
                Bali villa leasehold vs freehold ROI.
                <br />
                <span className="text-[color:var(--bvt-accent)]">The yield changes when the clock is running.</span>
              </h1>
              <p className="mt-8 max-w-[68ch] text-[17px] md:text-[20px] leading-[1.62] text-[color:var(--bvt-ink-body)]">
                Bali villa ROI is not only about nightly rates and occupancy. The
                ownership structure changes the math. Leasehold villas can look
                cheaper and higher-yielding at first glance, but the lease expires.
                Freehold can preserve more long-term value, but the entry price is
                usually higher. A serious buyer has to model both the income and the
                asset decay.
              </p>
            </div>
            <aside className="lg:col-span-4 border-t border-[color:var(--bvt-hairline)] pt-6">
              <div className="label-micro mb-5">Fast answer</div>
              <p className="text-[15px] leading-[1.7] text-[color:var(--bvt-ink-body)]">
                Leasehold is not bad by default. It is bad when the price does not
                compensate for the years disappearing. Freehold is not good by
                default. It is weak when the premium is so high that realistic net
                yield disappears.
              </p>
            </aside>
          </div>
        </header>

        <Section eyebrow="01 · The difference" title="Freehold asks what you own. Leasehold asks how much time is left.">
          <p>
            Buyers often compare Bali villas as if the only important variables are
            price, bedrooms, location, and projected rental income. Those matter, but
            tenure can change the entire investment case. A freehold-style asset is
            usually priced for long-term control and resale optionality. A leasehold
            asset is priced for a fixed number of years. When the lease expires, the
            buyer's economic interest can fall away unless an extension has been
            properly secured.
          </p>
          <p>
            That is why a cheap leasehold villa can produce a strong-looking Bali
            villa ROI, while a more expensive freehold villa can look slower on cash
            yield. The leasehold buyer may be paying less upfront, but part of the
            investment is consumed each year. The freehold buyer may be paying a
            premium, but may also be buying a stronger exit position.
          </p>
          <p>
            BVT's role is not to give legal advice. It is to make the investment math
            visible. For broader yield modeling, start with the{" "}
            <InlineLink href="/guides/bali-villa-roi">Bali villa ROI guide</InlineLink>{" "}
            and the <InlineLink href="/methodology">audit methodology</InlineLink>.
            Before a deposit, run the{" "}
            <InlineLink href="/guides/bali-villa-due-diligence-checklist">
              Bali villa due diligence checklist
            </InlineLink>.
          </p>
        </Section>

        <Section eyebrow="02 · Lease decay" title="A leasehold villa is a rental asset and a melting asset at the same time.">
          <p>
            Lease decay is simple but often ignored. If a leasehold villa costs
            $300,000 and has 20 years remaining, a straight-line model treats about
            $15,000 per year as economic value decay. That does not mean the bank
            account loses $15,000 in cash each year. It means the buyer is consuming
            one year of the purchased lease term. When calculating true net yield,
            that cost should sit beside management fees, maintenance, utilities,
            vacancy, and platform commissions.
          </p>
          <p>
            Without lease decay, a 20-year lease can look unfairly similar to a
            35-year lease or freehold. With lease decay included, the shorter lease
            has to be much cheaper or much more profitable to compete. This is why
            BVT subtracts annual lease depreciation before showing net yield.
          </p>
          <div className="border border-[color:var(--bvt-hairline)] rounded-md p-5 bg-[color:var(--bvt-bg-elev)]">
            <div className="label-micro mb-3">Simple lease decay example</div>
            <p className="font-mono text-[13px] md:text-[14px] leading-relaxed text-[color:var(--bvt-ink)]">
              $300,000 purchase price / 20 remaining lease years = $15,000 annual lease decay
            </p>
          </div>
        </Section>

        <Section eyebrow="03 · Extension risk" title="Extendable is not the same as extended.">
          <p>
            Many Bali listings say a lease is extendable. That phrase can mean very
            different things. Sometimes there is a written extension option with
            pricing logic. Sometimes there is only an informal expectation that the
            landowner may negotiate later. Those two situations should not receive
            the same ROI treatment.
          </p>
          <p>
            If extension terms are unclear, the conservative move is to underwrite
            the villa only to the current lease end date. Any future extension is
            upside, not base-case value. Buyers should ask who grants the extension,
            how the price is calculated, when it can be exercised, what happens if
            the land changes hands, and whether the agreement survives disputes or
            succession issues.
          </p>
        </Section>

        <Section eyebrow="04 · Freehold premium" title="Freehold can protect exit value, but it can also crush yield.">
          <p>
            Freehold-style pricing can make sense when the land is scarce, the
            location is durable, and the buyer cares about long-term resale value.
            But a freehold premium is not automatically smart. If a buyer pays so
            much for the asset that realistic net rental income falls to a weak
            yield, the investment may be more of a land appreciation bet than a
            villa cashflow deal.
          </p>
          <p>
            That is not necessarily wrong. Some buyers want lifestyle optionality,
            long hold periods, or land exposure. The mistake is calling that same
            deal a high-yield rental investment. BVT separates cash yield from the
            story around long-term appreciation.
          </p>
        </Section>

        <Section eyebrow="05 · Area context" title="The right tenure depends on the micro-market.">
          <p>
            In high-demand areas like <InlineLink href="/canggu">Canggu</InlineLink>,{" "}
            <InlineLink href="/berawa">Berawa</InlineLink>, and{" "}
            <InlineLink href="/pererenan">Pererenan</InlineLink>, buyers may accept
            lower yields for liquidity and demand depth. In{" "}
            <InlineLink href="/ubud">Ubud</InlineLink>, a leasehold villa's ROI
            depends heavily on access, moisture, design, and wellness-market fit. In{" "}
            <InlineLink href="/uluwatu">Uluwatu</InlineLink>,{" "}
            <InlineLink href="/bingin">Bingin</InlineLink>, and{" "}
            <InlineLink href="/ungasan">Ungasan</InlineLink>, off-plan risk and
            seasonality can matter as much as tenure. In{" "}
            <InlineLink href="/sanur">Sanur</InlineLink>,{" "}
            <InlineLink href="/seminyak">Seminyak</InlineLink>, and{" "}
            <InlineLink href="/nusa-dua">Nusa Dua</InlineLink>, buyer profile and
            management strategy can shift the right answer.
          </p>
          <p>
            The practical rule is this: compare tenure, price, and net yield together.
            A cheap leasehold with strong demand and enough years left can outperform
            an overpriced freehold. A short lease with vague extension terms can turn
            a glossy ROI claim into a poor risk-adjusted investment.
          </p>
        </Section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">Next checks</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Before relying on the ROI number.
              </h2>
            </div>
            <div className="lg:col-span-8">
              <ol className="space-y-4 list-decimal pl-5 marker:text-[color:var(--bvt-accent)] marker:font-mono text-[15px] md:text-[16px] leading-[1.75] text-[color:var(--bvt-ink-body)]">
                <li>Confirm the legal structure with an independent lawyer.</li>
                <li>Get the lease agreement and any extension option in writing.</li>
                <li>Model lease decay before comparing net yield.</li>
                <li>Verify actual rental statements instead of relying on projected occupancy.</li>
                <li>Compare the villa with audited listings in the same area and bedroom tier.</li>
              </ol>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                <Link href="/guides/bali-villa-roi" className="link-editorial text-[14px]">
                  Read the full Bali villa ROI guide
                </Link>
                <Link href="/#listings-section" className="link-editorial text-[14px]">
                  Browse audited villas
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">FAQ</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Leasehold vs freehold ROI questions.
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
