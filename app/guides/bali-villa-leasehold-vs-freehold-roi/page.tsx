import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://balivillatruth.com";
const PAGE_URL = `${SITE_URL}/guides/bali-villa-leasehold-vs-freehold-roi`;

const faqItems = [
  {
    q: "Is leasehold or freehold better for Bali villa ROI?",
    a: "Neither is automatically better. Compare the asking price, supported rental assumptions, operating costs, remaining lease years, and documented ownership rights. BVT's net-yield badge is a screening estimate, not cash-on-cash return or a forecast of resale value.",
  },
  {
    q: "How does lease decay affect ROI?",
    a: "BVT divides the audit price by stated remaining lease years and subtracts that noncash allowance from modeled operating income. At an illustrative $300,000 price and 20 years left, the allowance is $15,000 a year, or 5 percentage points of that price. It is not an observed resale-price decline or an annual cash bill.",
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
      headline: "Bali Villa Leasehold vs Freehold ROI: Compare the Model and the Lease Term",
      description:
        "A buyer-focused guide to BVT's modeled lease allowance, remaining lease years, ownership evidence, and Bali villa due diligence.",
      image: `${SITE_URL}/og-image.png`,
      datePublished: "2026-05-13",
      dateModified: "2026-10-04",
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
  title: "Bali Villa Leasehold vs Freehold ROI — Model and Lease Term",
  description:
    "Compare Bali villa leasehold and freehold scenarios with BVT's noncash lease allowance, stated term, ownership evidence, and due diligence checks.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Bali Villa Leasehold vs Freehold ROI — Model and Lease Term",
    description:
      "How stated lease years change BVT's modeled yield, and what ownership and extension evidence buyers still need.",
    url: PAGE_URL,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bali Villa Leasehold vs Freehold ROI — Model and Lease Term",
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
                <span className="text-[color:var(--bvt-accent)]">Compare the income and the lease term.</span>
              </h1>
              <p className="mt-8 max-w-[68ch] text-[17px] md:text-[20px] leading-[1.62] text-[color:var(--bvt-ink-body)]">
                Bali villa ROI depends on the audit price, modeled rental income,
                operating costs, and the rights a buyer can actually document. For
                a leasehold villa with a stated remaining term, BVT includes a
                straight-line lease allowance in its screening yield. That is not
                a measured fall in market value or a prediction of your cash flow.
              </p>
            </div>
            <aside className="lg:col-span-4 border-t border-[color:var(--bvt-hairline)] pt-6">
              <div className="label-micro mb-5">Fast answer</div>
              <p className="text-[15px] leading-[1.7] text-[color:var(--bvt-ink-body)]">
                Compare the same income and cost assumptions against the price and
                remaining term. Then ask an independent lawyer to verify the title,
                legal structure, and any extension right before treating a listing's
                tenure label as established.
              </p>
            </aside>
          </div>
        </header>

        <Section eyebrow="01 · The difference" title="Confirm the rights, then compare the remaining years.">
          <p>
            A listing's freehold or leasehold label is a starting point, not legal
            proof of what a buyer can acquire. Ask for the underlying title,
            agreement, stated end date, and any extension terms. An independent
            lawyer should check the buyer's proposed structure and rights before
            you use them in an investment decision.
          </p>
          <p>
            In BVT's comparison, an eligible leasehold with a stated term receives
            an annual noncash lease allowance. A listing modeled as freehold does
            not. This difference changes the displayed screening yield; it does
            not establish what either property will earn or sell for. Keep acquisition
            costs, taxes, financing, major works, and actual resale terms in a
            separate property-specific underwriting case.
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

        <Section eyebrow="02 · Lease decay" title="See what remaining years change in the model.">
          <p>
            For a modeled leasehold, BVT divides its audit asking-price basis by
            stated remaining lease years. If that price is $300,000 and 20 years
            remain, the annual allowance is $15,000. It reduces BVT's modeled net
            yield by 5 percentage points of the $300,000 basis. This is a noncash
            model allowance, not an observed resale-price decline, tax deduction,
            or annual payment to a landowner.
          </p>
          <p>
            The published badge separately assumes 65% occupancy and one pooled
            40% operating-cost load on modeled gross revenue. Neither is a verified
            bill or booking history. The August nightly-rate sample also has
            unverified distinct-property coverage, so replace all three inputs
            with property evidence before treating the result as an investment case.
          </p>
          <div className="border border-[color:var(--bvt-hairline)] rounded-md p-5 bg-[color:var(--bvt-bg-elev)]">
            <div className="label-micro mb-3">Illustrative term sensitivity</div>
            <p className="font-mono text-[13px] md:text-[14px] leading-relaxed text-[color:var(--bvt-ink)]">
              $300,000 audit price / 20 stated lease years = $15,000 annual allowance
            </p>
            <ul className="mt-4 space-y-1 text-[13px] md:text-[14px] leading-relaxed">
              <li>10 years: $30,000 per year; 10 percentage points of price</li>
              <li>20 years: $15,000 per year; 5 percentage points of price</li>
              <li>30 years: $10,000 per year; about 3.3 percentage points of price</li>
            </ul>
            <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--bvt-ink-muted)]">
              Only the term changes in this arithmetic example. It is not a listing,
              an appraisal, or a forecast of resale proceeds.
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
            If extension terms are unclear, test the purchase against the current
            documented end date instead of assuming extra years in the base case.
            Buyers should ask who grants the extension,
            how the price is calculated, when it can be exercised, what happens if
            the land changes hands, and whether the agreement survives disputes or
            succession issues.
          </p>
        </Section>

        <Section eyebrow="04 · Freehold premium" title="Do not count on appreciation to repair a weak income case.">
          <p>
            A listing described as freehold has no BVT lease allowance, but that
            alone does not establish its buyer's legal rights, net cash return, or
            resale value. Compare its total acquisition basis and evidence-backed
            rental income with the leasehold alternative, then stress-test a lower
            occupancy or nightly rate. Keep potential appreciation out of an income
            comparison unless you have a separate, supportable exit case.
          </p>
          <p>
            BVT does not value future land appreciation or verify a buyer's legal
            structure. The same ownership label can describe different documents;
            obtain independent legal and tax review before relying on it.
          </p>
        </Section>

        <Section eyebrow="05 · Area context" title="Use location pages to find comparable dossiers.">
          <p>
            Browse <InlineLink href="/canggu">Canggu</InlineLink>,{" "}
            <InlineLink href="/berawa">Berawa</InlineLink>,{" "}
            <InlineLink href="/pererenan">Pererenan</InlineLink>,{" "}
            <InlineLink href="/ubud">Ubud</InlineLink>,{" "}
            <InlineLink href="/uluwatu">Uluwatu</InlineLink>,{" "}
            <InlineLink href="/bingin">Bingin</InlineLink>,{" "}
            <InlineLink href="/ungasan">Ungasan</InlineLink>,{" "}
            <InlineLink href="/sanur">Sanur</InlineLink>,{" "}
            <InlineLink href="/seminyak">Seminyak</InlineLink>, and{" "}
            <InlineLink href="/nusa-dua">Nusa Dua</InlineLink> to find current
            dossiers by area. Match the stated tenure, remaining years, price,
            bedroom count, and model-scope notes before comparing displayed yields.
            These pages are browsing routes, not verified rankings of demand,
            liquidity, safety, or achieved rental performance.
          </p>
          <p>
            A short stated lease or vague extension changes the questions to ask,
            even when a listing's gross yield looks attractive. Start with the
            documents and test downside assumptions rather than inferring a safer
            investment from an area name or tenure label.
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
                <li>Compare with modeled dossiers in the same area and bedroom tier; note where ROI is not modeled.</li>
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
