import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

/**
 * Shared server component for location pages: /canggu, /uluwatu, etc.
 * Each wrapper page supplies a slug + editorial copy; this renders the
 * SEO shell, fetches listings for the area, and emits ItemList JSON-LD.
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

function formatUsd(n: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n)}`;
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
    <div className="min-h-screen bg-[#0a1120] text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">{cfg.name}</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            {cfg.name} villa investments
            <span className="block text-[#d4943a] text-2xl md:text-3xl font-bold mt-2">
              {cfg.tagline}
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mt-4">
            {cfg.intro}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm">
            <div>
              <span className="text-slate-500">Typical price: </span>
              <span className="text-slate-200 font-semibold">{cfg.priceBand}</span>
            </div>
            <div>
              <span className="text-slate-500">Nightly rate: </span>
              <span className="text-slate-200 font-semibold">{cfg.nightlyBand}</span>
            </div>
            <div>
              <span className="text-slate-500">Audited: </span>
              <span className="text-slate-200 font-semibold">{count} villas</span>
            </div>
          </div>
        </header>

        {/* Pros / Cons */}
        <section className="grid md:grid-cols-2 gap-4 mb-12">
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-5">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">
              Why investors like {cfg.name}
            </h2>
            <ul className="space-y-2 text-sm text-slate-300 leading-relaxed">
              {cfg.pros.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-400 shrink-0">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-5">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">
              What we&apos;d stress-test
            </h2>
            <ul className="space-y-2 text-sm text-slate-300 leading-relaxed">
              {cfg.cons.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-400 shrink-0">⚠</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Listings grid */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
              Audited villas in {cfg.name}
            </h2>
            <Link
              href="/"
              className="text-xs text-[#d4943a] hover:text-[#e5a84d] font-semibold"
            >
              All locations →
            </Link>
          </div>

          {count === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              <p>
                We haven&apos;t finished auditing {cfg.name} listings yet — check
                back next week after our re-scrape runs, or{" "}
                <Link href="/" className="text-[#d4943a] hover:underline">
                  browse all audited villas
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((v: any) => {
                const price = Number(v.last_price) || 0;
                const roi = Number(v.projected_roi) || 0;
                const roiColor =
                  roi >= 8
                    ? "text-emerald-400"
                    : roi >= 5
                    ? "text-blue-400"
                    : "text-slate-400";
                const flags = (v.flags || "").split(",").map((f: string) => f.trim()).filter(Boolean);
                const hasRisk = flags.some((f: string) =>
                  ["SHORT_LEASE", "OFF_PLAN", "EXTREME_BUDGET"].includes(f)
                );

                return (
                  <Link
                    key={v.id}
                    href={`/listing/${v.slug}`}
                    className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all"
                  >
                    {v.thumbnail_url ? (
                      <div className="aspect-[4/3] bg-slate-800 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.thumbnail_url}
                          alt={v.villa_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-slate-800" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-bold text-slate-100 leading-tight line-clamp-2 group-hover:text-white">
                          {v.villa_name}
                        </h3>
                        {hasRisk && (
                          <span className="shrink-0 text-[9px] font-bold bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded uppercase">
                            Flag
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-lg font-bold text-slate-100">
                            {formatUsd(price)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {v.bedrooms || "?"} bed · {v.location}
                          </div>
                        </div>
                        <div className={`text-right ${roiColor}`}>
                          <div className="text-xl font-bold tabular-nums">
                            {roi.toFixed(1)}%
                          </div>
                          <div className="text-[9px] uppercase text-slate-500">Net ROI</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Neighbors internal-linking block — helps SEO and exploration */}
        {cfg.neighbors.length > 0 && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 mb-12">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              Nearby areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {cfg.neighbors.map((n) => (
                <Link
                  key={n.slug}
                  href={`/${n.slug}`}
                  className="inline-flex items-center gap-1 text-sm bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {n.name} →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer-ish nav */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">← All audited villas</Link>
          <span className="mx-3 text-slate-700">|</span>
          <Link href="/methodology" className="hover:text-slate-300">Methodology</Link>
          <span className="mx-3 text-slate-700">|</span>
          <Link href="/about" className="hover:text-slate-300">About</Link>
          <span className="mx-3 text-slate-700">|</span>
          <Link href="/contact" className="hover:text-slate-300">Contact</Link>
        </div>
      </div>
    </div>
  );
}
