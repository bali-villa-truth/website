import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ThumbImg from "@/app/_components/ThumbImg";

/**
 * Shared server component for location pages: /canggu, /uluwatu, etc.
 * Each wrapper page supplies a slug + editorial copy; this renders the
 * SEO shell, fetches listings for the area, and emits ItemList JSON-LD.
 *
 * Design: magazine feature layout — serif display headline, two-column
 * editorial grid (intro + area factoids), hairline-separated pros/cons,
 * and a gallery grid of audited villas. Reference: FT Weekend magazine,
 * The Modern House area pages.
 */

export type AreaConfig = {
  slug: string;
  name: string;
  tagline: string;
  // One-paragraph editorial "why this area" — helps rankings, helps buyers
  intro: string;
  // 3-4 honest pros
  pros: string[];
  // 3-4 honest risks/cons
  cons: string[];
  // Typical price band (USD)
  priceBand: string;
  // Typical nightly rate ballpark
  nightlyBand: string;
  // Which Supabase location values count as "in this area"
  matchLocations: string[];
  // Neighboring areas for internal linking
  neighbors: { slug: string; name: string }[];
};

const SITE_URL = "https://balivillatruth.com";

// Fallback IDR→USD rate. MUST stay in sync with:
//   - app/api/generate-deep-audit/route.ts (USD_RATE_FALLBACK)
//   - app/listing/[slug]/page.tsx (FALLBACK_RATES.IDR)
// If this drifts, identical listings display different USD prices across pages.
const USD_RATE_FALLBACK = 16782;

// last_price is stored in IDR (billions for a typical villa). Prefer the
// scraped USD figure from price_description (most listings carry "USD 123,456"),
// fall back to IDR → USD conversion so the card never shows raw rupiah.
function formatUsd(last_price_idr: number, price_description?: string | null): string {
  let usd = 0;
  if (price_description) {
    const m = price_description.match(/USD\s*([\d,]+)/i);
    if (m) usd = parseFloat(m[1].replace(/,/g, ""));
  }
  if (!usd) usd = (last_price_idr || 0) / USD_RATE_FALLBACK;
  if (!usd || usd <= 0) return "—";
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(usd >= 10_000_000 ? 0 : 2)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1000)}k`;
  return `$${Math.round(usd)}`;
}

async function getAreaListings(cfg: AreaConfig, max = 12) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("listings_tracker")
    .select("id, slug, villa_name, location, last_price, bedrooms, projected_roi, thumbnail_url, flags, price_description")
    .eq("status", "audited")
    .gt("last_price", 0)
    .in("location", cfg.matchLocations)
    .order("projected_roi", { ascending: false })
    .limit(max);
  return data || [];
}

export default async function AreaPage({ cfg }: { cfg: AreaConfig }) {
  const listings = await getAreaListings(cfg);
  const count = listings.length;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: cfg.name,
            item: `${SITE_URL}/${cfg.slug}`,
          },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: listings.slice(0, 10).map((v: any, i: number) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/listing/${v.slug}`,
          name: v.villa_name,
        })),
      },
    ],
  };

  return (
    <div className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <article className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-10 text-[12px]" aria-label="Breadcrumb">
          <Link href="/" className="text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors">
            Home
          </Link>
          <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
          <span className="text-[color:var(--bvt-ink)]">{cfg.name}</span>
        </nav>

        {/* Editorial hero — two-column composition */}
        <header className="mb-16 md:mb-24">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
            <span className="label-micro">Area audit · {cfg.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[color:var(--bvt-ink)] leading-[0.98] tracking-[-0.02em] text-[44px] sm:text-[56px] md:text-[72px] lg:text-[84px]">
                {cfg.name}.
                <br />
                <span className="text-[color:var(--bvt-accent)]">{cfg.tagline}</span>
              </h1>
              <p className="mt-8 max-w-[58ch] text-[17px] md:text-[19px] leading-[1.6] text-[color:var(--bvt-ink-body)]">
                {cfg.intro}
              </p>
            </div>

            <aside className="lg:col-span-4 lg:pb-4">
              <div className="border-t border-[color:var(--bvt-hairline)] pt-6 space-y-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="label-micro">Price band</span>
                  <span className="font-mono tabular-nums text-[15px] text-[color:var(--bvt-ink)]">{cfg.priceBand}</span>
                </div>
                <div className="h-px bg-[color:var(--bvt-hairline)]" />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="label-micro">Nightly rate</span>
                  <span className="font-mono tabular-nums text-[15px] text-[color:var(--bvt-ink)]">{cfg.nightlyBand}</span>
                </div>
                <div className="h-px bg-[color:var(--bvt-hairline)]" />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="label-micro">Audited</span>
                  <span className="font-mono tabular-nums text-[15px] text-[color:var(--bvt-ink)]">{count} villas</span>
                </div>
              </div>
            </aside>
          </div>
        </header>

        {/* Pros / What we'd stress-test — editorial two-column */}
        <section className="mb-20 md:mb-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-8 bg-[color:var(--bvt-accent)]" aria-hidden />
                <span className="label-micro">Why investors like {cfg.name}</span>
              </div>
              <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)]">
                {cfg.pros.map((p, i) => (
                  <li key={i} className="py-4 flex gap-4">
                    <span className="font-mono text-[11px] text-[color:var(--bvt-accent)] tabular-nums mt-1">
                      0{i + 1}
                    </span>
                    <span className="text-[15px] leading-[1.6] text-[color:var(--bvt-ink-body)]">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-8 bg-[color:var(--bvt-warn)]" aria-hidden />
                <span className="label-micro">What we&apos;d stress-test</span>
              </div>
              <ul className="divide-y divide-[color:var(--bvt-hairline)] border-t border-[color:var(--bvt-hairline)]">
                {cfg.cons.map((c, i) => (
                  <li key={i} className="py-4 flex gap-4">
                    <span className="font-mono text-[11px] text-[color:var(--bvt-warn)] tabular-nums mt-1">
                      0{i + 1}
                    </span>
                    <span className="text-[15px] leading-[1.6] text-[color:var(--bvt-ink-body)]">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Listings grid — editorial card style */}
        <section className="mb-20 md:mb-28">
          <div className="flex items-end justify-between mb-8 md:mb-10 border-b border-[color:var(--bvt-hairline)] pb-5">
            <div>
              <div className="label-micro mb-2">The ledger</div>
              <h2 className="font-display text-[color:var(--bvt-ink)] text-[32px] md:text-[40px] leading-tight tracking-[-0.02em]">
                Audited villas in {cfg.name}
              </h2>
            </div>
            <Link
              href="/"
              className="link-editorial text-[13px] pb-1 hidden sm:inline-block"
            >
              All locations →
            </Link>
          </div>

          {count === 0 ? (
            <div className="border border-[color:var(--bvt-hairline)] rounded-md p-10 text-center">
              <div className="label-micro mb-3">Awaiting scrape</div>
              <p className="text-[15px] text-[color:var(--bvt-ink-body)] max-w-[50ch] mx-auto">
                We haven&apos;t finished auditing {cfg.name} listings yet — check
                back next week after our re-scrape runs, or{" "}
                <Link href="/" className="link-editorial">
                  browse all audited villas
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((v: any) => {
                const roi = Number(v.projected_roi) || 0;
                const roiColor =
                  roi >= 8
                    ? "text-[color:var(--bvt-good)]"
                    : roi >= 5
                    ? "text-[color:var(--bvt-accent)]"
                    : "text-[color:var(--bvt-ink-muted)]";
                const flags = (v.flags || "").split(",").map((f: string) => f.trim()).filter(Boolean);
                const hasRisk = flags.some((f: string) =>
                  ["SHORT_LEASE", "OFF_PLAN", "EXTREME_BUDGET"].includes(f)
                );

                return (
                  <Link
                    key={v.id}
                    href={`/listing/${v.slug}`}
                    className="group block border border-[color:var(--bvt-hairline)] hover:border-[color:var(--bvt-accent)]/60 bg-[color:var(--bvt-bg-elev)] hover:bg-[color:var(--bvt-bg-soft)] rounded-md overflow-hidden transition-all duration-300"
                  >
                    {v.thumbnail_url ? (
                      <div className="aspect-[4/3] bg-[color:var(--bvt-bg-soft)] overflow-hidden">
                        <ThumbImg
                          src={v.thumbnail_url}
                          alt={v.villa_name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-[color:var(--bvt-bg-soft)]" />
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-display text-[17px] leading-[1.2] tracking-[-0.01em] text-[color:var(--bvt-ink)] line-clamp-2">
                          {v.villa_name}
                        </h3>
                        {hasRisk && (
                          <span className="shrink-0 label-micro text-[color:var(--bvt-warn)] border border-[color:var(--bvt-warn)]/40 px-1.5 py-0.5 rounded">
                            Flag
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between border-t border-[color:var(--bvt-hairline)] pt-3">
                        <div>
                          <div className="font-mono tabular-nums text-[18px] text-[color:var(--bvt-ink)] leading-none">
                            {formatUsd(v.last_price, v.price_description)}
                          </div>
                          <div className="text-[11px] text-[color:var(--bvt-ink-dim)] mt-1.5">
                            {v.bedrooms || "?"} bed · {v.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono tabular-nums text-[22px] leading-none ${roiColor}`}>
                            {roi.toFixed(1)}%
                          </div>
                          <div className="label-micro mt-1.5">Net ROI</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Neighbors — internal linking, FT-style footer row */}
        {cfg.neighbors.length > 0 && (
          <section className="pt-10 border-t border-[color:var(--bvt-hairline)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">Nearby areas</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {cfg.neighbors.map((n) => (
                <Link
                  key={n.slug}
                  href={`/${n.slug}`}
                  className="link-editorial text-[15px]"
                >
                  {n.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
