import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://balivillatruth.com";
const PAGE_URL = `${SITE_URL}/guides/bali-villa-occupancy-rates`;

const areaNotes = [
  {
    area: "Canggu, Berawa, Pererenan",
    signal: "Deep demand, high competition",
    note: "These areas have strong rental demand, but buyers pay for that demand through higher land and villa prices. A high occupancy assumption does not automatically create a strong net yield.",
    href: "/canggu",
  },
  {
    area: "Uluwatu, Bingin, Ungasan",
    signal: "Premium rates, more seasonality",
    note: "Bukit villas can command strong nightly rates, but occupancy can swing with season, beach access, view quality, construction disruption, and off-plan delivery risk.",
    href: "/uluwatu",
  },
  {
    area: "Seminyak, Sanur, Nusa Dua",
    signal: "Mature demand, different buyer profiles",
    note: "These markets can be steadier, but mature areas also have entrenched competition. The right question is not only occupancy, but occupancy at what rate and at what cost.",
    href: "/sanur",
  },
  {
    area: "Ubud and inland markets",
    signal: "Experience-led demand",
    note: "Ubud occupancy is harder to judge from bedroom count alone. View, wellness positioning, access, quiet, and operating quality can matter as much as the villa size.",
    href: "/ubud",
  },
];

const modelRows = [
  { area: "Canggu", href: "/canggu", estimate: "41%", source: "Review-density model", sample: "75-property sample" },
  { area: "Berawa", href: "/berawa", estimate: "41%", source: "Review-density model", sample: "75-property sample" },
  { area: "Pererenan", href: "/pererenan", estimate: "49%", source: "Review-density model", sample: "75-property sample" },
  { area: "Uluwatu", href: "/uluwatu", estimate: "42%", source: "Review-density model", sample: "75-property sample" },
  { area: "Bingin", href: "/bingin", estimate: "65%", source: "Flat fallback", sample: "No exact Bingin review model yet" },
  { area: "Seminyak", href: "/seminyak", estimate: "42%", source: "Review-density model", sample: "75-property sample" },
  { area: "Ubud", href: "/ubud", estimate: "41%", source: "Review-density model", sample: "75-property sample" },
  { area: "Sanur", href: "/sanur", estimate: "80%", source: "Review-density model ceiling", sample: "75-property sample" },
  { area: "Ungasan", href: "/ungasan", estimate: "42%", source: "Review-density model", sample: "30-property sample" },
  { area: "Nusa Dua", href: "/nusa-dua", estimate: "51%", source: "Review-density model", sample: "75-property sample" },
];

const faqItems = [
  {
    q: "What occupancy rate should I assume for a Bali villa?",
    a: "Do not use one island-wide number. Start with the area, villa type, nightly rate, seasonality, and management plan. BVT uses area-level occupancy assumptions as a screening model, then expects buyers to verify property-level booking history before offer.",
  },
  {
    q: "Is 80% occupancy realistic in Bali?",
    a: "It can be realistic for some well-located, professionally operated villas, but it should not be treated as a default. At 80% occupancy the villa also needs enough nightly rate and margin after costs to justify the asking price.",
  },
  {
    q: "Why does occupancy matter so much for ROI?",
    a: "Occupancy multiplies nightly rate. A small change in occupancy can move annual gross revenue sharply, which then changes net yield after management, booking costs, maintenance, utilities, and lease decay.",
  },
  {
    q: "Can a lower-occupancy villa still be a better investment?",
    a: "Yes. A lower-occupancy villa can win if it has a lower purchase price, stronger nightly rate, better lease terms, lower capex risk, or a more realistic operating plan.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Bali villa occupancy rates", item: PAGE_URL },
      ],
    },
    {
      "@type": "Article",
      "@id": `${PAGE_URL}#article`,
      mainEntityOfPage: PAGE_URL,
      headline: "Bali Villa Occupancy Rates: How Buyers Should Stress-Test Rental Demand",
      description:
        "A buyer-focused guide to Bali villa occupancy rates, area demand, seasonality, nightly rates, and why occupancy must be stress-tested before trusting ROI claims.",
      image: `${SITE_URL}/og-image.png`,
      datePublished: "2026-05-14",
      dateModified: "2026-05-14",
      author: { "@type": "Organization", name: "Bali Villa Truth", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Bali Villa Truth", url: SITE_URL },
      articleSection: "Bali Villa Investment",
      keywords: [
        "bali villa occupancy rates",
        "bali villa ROI",
        "bali villa investment",
        "bali villa rental yield",
        "bali villa net yield",
        "bali villa due diligence",
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
  title: "Bali Villa Occupancy Rates: ROI Stress Test",
  description:
    "Bali villa occupancy rates explained for investors: area demand, seasonality, nightly rates, management quality, and how occupancy changes net yield.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Bali Villa Occupancy Rates: ROI Stress Test",
    description:
      "How to stress-test Bali villa occupancy assumptions before trusting rental-yield or ROI claims.",
    url: PAGE_URL,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bali Villa Occupancy Rates: ROI Stress Test",
    description:
      "A buyer-side guide to occupancy assumptions, seasonality, area demand, and true Bali villa net yield.",
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

export default function BaliVillaOccupancyRatesPage() {
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
          <span className="text-[color:var(--bvt-ink)]">Occupancy rates</span>
        </nav>

        <header className="mb-14 md:mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Buyer guide · rental demand</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[58px] md:text-[74px] lg:text-[88px]">
                Bali villa occupancy rates.
                <br />
                <span className="text-[color:var(--bvt-accent)]">The input that can fake ROI.</span>
              </h1>
              <p className="mt-8 max-w-[68ch] text-[17px] md:text-[20px] leading-[1.62] text-[color:var(--bvt-ink-body)]">
                Occupancy is the easiest way to make a Bali villa spreadsheet look
                better than the investment really is. Change the booked-night
                assumption, and the ROI changes instantly. Buyers need to know
                whether occupancy is supported by the area, the rate, the villa
                quality, and the management plan before trusting the number.
              </p>
            </div>
            <aside className="lg:col-span-4 border-t border-[color:var(--bvt-hairline)] pt-6">
              <div className="label-micro mb-5">BVT rule</div>
              <p className="font-mono text-[34px] leading-none text-[color:var(--bvt-ink)]">Occ x ADR</p>
              <p className="mt-4 text-[15px] leading-[1.7] text-[color:var(--bvt-ink-body)]">
                Occupancy is only useful beside nightly rate. A full calendar at a
                weak rate can underperform a more selective calendar at a stronger
                rate after costs.
              </p>
            </aside>
          </div>
        </header>

        <Section eyebrow="01 · Why it matters" title="Occupancy moves revenue before any other cost is counted.">
          <p>
            Bali villa ROI starts with annual rental revenue. That revenue is
            usually nightly rate multiplied by occupied nights. If the occupancy
            assumption is too high, every number after it is too high: gross yield,
            net income, payback period, and the price a buyer thinks they can afford.
          </p>
          <p>
            The trap is that occupancy sounds precise even when it is only a sales
            assumption. A seller can say 75% or 80% occupancy, but the buyer still
            needs to know whether that came from actual owner statements, a
            channel-manager export, comparable villas, a manager projection, or
            hope. BVT treats occupancy as a stress-test input, not a promise.
          </p>
          <p>
            Start with the <InlineLink href="/guides/bali-villa-roi">Bali villa ROI guide</InlineLink>{" "}
            for the full net-yield formula, then use this page to pressure-test the
            demand side of the calculation.
          </p>
        </Section>

        <Section eyebrow="02 · BVT method" title="Area demand is a proxy. Property history is proof.">
          <p>
            BVT uses area-level occupancy assumptions to compare more than 2,000
            audited listings consistently. The public model uses market demand
            signals, including Booking.com review-density patterns by area, then
            applies the same logic across listings so buyers can compare one villa
            against another without accepting every seller's custom forecast.
          </p>
          <p>
            That is useful for screening. It is not the same as verified booking
            history for a specific villa. Before an offer, buyers should ask for
            monthly booking exports, owner statements, average daily rate, platform
            mix, direct-booking share, cancellation history, review count, review
            score, low-season discounting, and any periods blocked for owner use.
          </p>
          <div className="border border-[color:var(--bvt-hairline)] rounded-md bg-[color:var(--bvt-bg-elev)] p-5">
            <div className="label-micro mb-3">Screening vs proof</div>
            <p className="text-[14px] md:text-[15px] leading-relaxed text-[color:var(--bvt-ink-body)]">
              BVT occupancy estimate = useful for comparing listings at scale.
              Property booking records = needed before relying on a specific deal.
            </p>
          </div>
        </Section>

        <Section eyebrow="03 · Current model" title="BVT publishes the screening estimate, then asks buyers to verify it.">
          <p>
            These are the current BVT public screening estimates used for area-level
            comparison. They are rounded to the nearest whole percent and come from
            the review-density model in the rate engine, except where an area falls
            back to the flat default. They are not a claim that any specific villa
            will book that percentage of nights.
          </p>
          <div className="md:hidden space-y-3">
            {modelRows.map((row) => (
              <Link
                key={row.area}
                href={row.href}
                className="block border border-[color:var(--bvt-hairline)] hover:border-[color:var(--bvt-accent)]/60 rounded-md bg-[color:var(--bvt-bg-elev)] p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-[color:var(--bvt-ink)]">{row.area}</div>
                    <div className="mt-1 text-[12px] text-[color:var(--bvt-ink-muted)]">{row.source}</div>
                  </div>
                  <div className="font-mono text-[20px] leading-none text-[color:var(--bvt-accent)]">{row.estimate}</div>
                </div>
                <div className="mt-3 text-[12px] leading-relaxed text-[color:var(--bvt-ink-muted)]">{row.sample}</div>
              </Link>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto border border-[color:var(--bvt-hairline)] rounded-md">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[color:var(--bvt-bg-elev)] text-[color:var(--bvt-ink-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Area</th>
                  <th className="px-4 py-3 font-semibold">BVT screening estimate</th>
                  <th className="px-4 py-3 font-semibold">Source label</th>
                  <th className="px-4 py-3 font-semibold">Sample note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--bvt-hairline)]">
                {modelRows.map((row) => (
                  <tr key={row.area} className="align-top">
                    <td className="px-4 py-4">
                      <Link href={row.href} className="link-editorial font-semibold">
                        {row.area}
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-mono text-[color:var(--bvt-accent)]">{row.estimate}</td>
                    <td className="px-4 py-4 text-[color:var(--bvt-ink-body)]">{row.source}</td>
                    <td className="px-4 py-4 text-[color:var(--bvt-ink-muted)]">{row.sample}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Sanur currently sits at the model ceiling because its sampled review
            density is much higher than the other tracked areas. Bingin is the
            opposite kind of caution: the current exact-area model falls back to
            the default, so property-level booking records matter even more there.
          </p>
        </Section>

        <Section eyebrow="04 · Area context" title="The same occupancy number means different things in different markets.">
          <p>
            A villa in Canggu, Uluwatu, Sanur, and Ubud can all show the same
            occupancy assumption and still carry very different risk. Entry price,
            seasonality, road access, view quality, construction noise, competition,
            and guest profile all change how durable that occupancy is.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {areaNotes.map((item) => (
              <Link
                key={item.area}
                href={item.href}
                className="block border border-[color:var(--bvt-hairline)] hover:border-[color:var(--bvt-accent)]/60 rounded-md bg-[color:var(--bvt-bg-elev)] p-5 transition-colors"
              >
                <div className="label-micro mb-3">{item.area}</div>
                <div className="font-semibold text-[color:var(--bvt-ink)]">{item.signal}</div>
                <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">
                  {item.note}
                </p>
              </Link>
            ))}
          </div>
          <p>
            Use the location hubs to compare asking price, lease years, and net
            yield inside each market: <InlineLink href="/canggu">Canggu</InlineLink>,{" "}
            <InlineLink href="/uluwatu">Uluwatu</InlineLink>,{" "}
            <InlineLink href="/seminyak">Seminyak</InlineLink>,{" "}
            <InlineLink href="/ubud">Ubud</InlineLink>,{" "}
            <InlineLink href="/sanur">Sanur</InlineLink>, and{" "}
            <InlineLink href="/nusa-dua">Nusa Dua</InlineLink>.
          </p>
        </Section>

        <Section eyebrow="05 · Stress test" title="Do not ask whether occupancy is high. Ask what happens when it is wrong.">
          <p>
            A serious Bali villa model should show more than one occupancy case.
            Buyers should test base, downside, and upside assumptions. If a villa
            only works at a perfect occupancy number, the price is carrying no
            margin of safety. If it still looks reasonable after lower occupancy,
            higher costs, and lease decay, the deal deserves more attention.
          </p>
          <p>
            BVT listing pages include sensitivity tables so buyers can see how net
            yield changes when occupancy and nightly rate move. That matters because
            occupancy and rate often trade off. Discounting may fill the calendar,
            but it may not improve owner net income after fees, cleaning, utilities,
            and maintenance.
          </p>
          <p>
            Pair occupancy testing with the{" "}
            <InlineLink href="/guides/bali-villa-management-fees">management fees guide</InlineLink>{" "}
            and the{" "}
            <InlineLink href="/guides/bali-villa-leasehold-vs-freehold-roi">
              leasehold vs freehold ROI guide
            </InlineLink>. Revenue, expenses, and lease decay need to survive
            together.
          </p>
        </Section>

        <Section eyebrow="06 · Verification" title="Ask for the records that make occupancy real.">
          <p>
            Before deposit, request the source behind any occupancy claim. Useful
            records include channel-manager exports, Airbnb and Booking.com payout
            history, owner statements, cleaning logs, calendar screenshots with
            blocked nights separated from paid nights, tax records where available,
            review history, and the management agreement that produced the numbers.
          </p>
          <p>
            Then check whether the claimed occupancy depended on unusually low
            rates, owner friends, long stays, free nights, heavy discounts, or a
            launch-period promotion. A stable villa should not need a perfect story
            to produce a workable net yield.
          </p>
          <p>
            Use the{" "}
            <InlineLink href="/guides/bali-villa-due-diligence-checklist">
              Bali villa due diligence checklist
            </InlineLink>{" "}
            to turn those questions into an offer process.
          </p>
        </Section>

        <section className="py-10 md:py-14 border-t border-[color:var(--bvt-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="label-micro mb-4">FAQ</div>
              <h2 className="font-display text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.02em] text-[color:var(--bvt-ink)]">
                Common occupancy questions.
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
