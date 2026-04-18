import { createClient } from "@supabase/supabase-js";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ListingClient from "./ListingClient";
import ThumbImg from "@/app/_components/ThumbImg";

// Server-side Supabase client (uses service key for SSR, falls back to anon)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Title-case a scraped villa name like "BEAUTIFUL 2 BEDROOM OCEAN VIEW VILLA
 * FOR SALE FREEHOLD IN UNGASAN" → "Beautiful 2 Bedroom Ocean View Villa for
 * Sale Freehold in Ungasan". Keeps short connector words lowercase unless at
 * the start. Preserves villa IDs like "RF10254B".
 */
function toTitleCase(s: string): string {
  if (!s) return "";
  const lower = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on",
    "or", "the", "to", "with", "near", "via"
  ]);
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => {
      // Preserve BHI-style trailing IDs like rf10254b / rf5050
      if (/^rf\d+[a-z]?$/i.test(w)) return w.toUpperCase();
      if (i > 0 && lower.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function formatRelativeDate(iso?: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const days = Math.max(0, Math.round((Date.now() - then) / 86400000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}

// Human-readable labels + tooltips for flags (aligns with /methodology page)
const FLAG_LABELS: Record<string, { label: string; tone: "red" | "amber" | "slate"; tip: string }> = {
  SHORT_LEASE: { label: "SHORT LEASE", tone: "amber", tip: "Less than 15 years remaining — lease depreciation significantly impacts returns." },
  BUDGET_VILLA: { label: "BUDGET VILLA", tone: "amber", tip: "Asking price below the 25th percentile for its area + bedroom tier. Nightly rate discounted 30% vs. area median." },
  HIGH_YIELD: { label: "HIGH YIELD", tone: "amber", tip: "Gross yield exceeds 20%. Either genuinely underpriced, or the asking price doesn't reflect reality — investigate." },
  OPTIMISTIC_CLAIM: { label: "OPTIMISTIC CLAIM", tone: "amber", tip: "Gross yield between 15-20%. The gap between gross and net is where investors lose money." },
  OFF_PLAN: { label: "OFF PLAN", tone: "red", tip: "Property is not yet built. Higher risk: construction delays, specification changes, developer default." },
  EXTREME_BUDGET: { label: "EXTREME BUDGET", tone: "red", tip: "Price is far below area norms. Likely major issue: title problem, zoning, structural condition — verify carefully." },
  MULTI_UNIT: { label: "MULTI UNIT", tone: "amber", tip: "Listing covers multiple units — per-unit economics may differ from the headline figure." },
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getListing(slug: string) {
  const { data, error } = await supabase
    .from("listings_tracker")
    .select("*")
    .eq("slug", slug)
    .eq("status", "audited")
    .single();
  if (error || !data) return null;
  return data;
}

async function getComps(listing: any, max = 3) {
  // "Comparable" = same location, same bedroom count, not the same listing, audited.
  if (!listing.location || !listing.bedrooms) return [] as any[];
  const { data } = await supabase
    .from("listings_tracker")
    .select("id, slug, villa_name, bedrooms, last_price, projected_roi, thumbnail_url, lease_years, land_size")
    .eq("status", "audited")
    .eq("location", listing.location)
    .eq("bedrooms", listing.bedrooms)
    .neq("id", listing.id)
    .gt("last_price", 0)
    .limit(max * 3);
  const comps = (data || [])
    .filter((c: any) => (c.villa_name || "").length > 2)
    .slice(0, max);
  return comps;
}

async function getPriceHistory(listingId: number) {
  const { data } = await supabase
    .from("price_history")
    .select("price_usd, recorded_at")
    .eq("listing_id", listingId)
    .order("recorded_at", { ascending: true })
    .limit(50);
  return data || [];
}

// Price stored in `last_price` may be in IDR (when >= 1M) or USD. Convert to USD.
// Fallback IDR rate MUST stay in sync with:
//   - app/api/generate-deep-audit/route.ts (USD_RATE_FALLBACK)
//   - app/_lib/AreaPage.tsx (USD_RATE_FALLBACK)
// If this drifts, identical listings display different USD prices across pages.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, IDR: 16782, AUD: 1.53, EUR: 0.92, SGD: 1.34,
};

function parseListingPrice(listing: any): { amount: number; currency: string } {
  const desc = (listing.price_description || "").trim();
  const match = desc.match(/^(IDR|USD|AUD|EUR|SGD)\s*([\d,.\s]+)/i);
  if (match) {
    const amount = parseFloat(match[2].replace(/\s|,/g, "")) || 0;
    return { amount, currency: match[1].toUpperCase() };
  }
  const p = Number(listing.last_price) || 0;
  return { amount: p, currency: p >= 1e6 ? "IDR" : "USD" };
}

function getPriceUSD(listing: any): number {
  const { amount, currency } = parseListingPrice(listing);
  const r = FALLBACK_RATES[currency];
  if (!r || r <= 0) return amount;
  return currency === "USD" ? amount : amount / r;
}

// ---------------------------------------------------------------------------
// Dynamic metadata (SEO)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "Listing Not Found" };

  const priceUsdNum = Math.round(getPriceUSD(listing));
  const priceUsd = priceUsdNum > 0
    ? `$${priceUsdNum.toLocaleString("en-US")} USD`
    : "Price N/A";
  const roi = listing.projected_roi
    ? `${Number(listing.projected_roi).toFixed(1)}%`
    : "N/A";
  const beds = listing.bedrooms || "?";
  const location = listing.location || "Bali";
  const leaseType = listing.lease_years && listing.lease_years > 0
    ? `Leasehold (${listing.lease_years}yr)`
    : "Freehold";
  const niceName = toTitleCase(listing.villa_name || "");

  // Title puts the villa name first so branded queries (people Googling the
  // listing's exact name the way BHI titles it) can match us. The differentiator
  // (audit · yield) lives in the tail; the "| Bali Villa Truth" brand suffix is
  // added automatically by the root layout's title template.
  const title = listing.projected_roi
    ? `${niceName} — Audit · ${roi} Net Yield`
    : `${niceName} — Bali Villa Audit`;
  const description = `Independent audit: ${niceName}. ${beds}-bedroom ${leaseType.toLowerCase()} villa in ${location} listed at ${priceUsd}. Stress-tested net yield: ${roi} after 40% expenses. Full breakdown, comparable listings, sensitivity analysis.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://balivillatruth.com/listing/${slug}`,
      images: listing.thumbnail_url
        ? [{ url: listing.thumbnail_url, width: 800, height: 600, alt: niceName }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: listing.thumbnail_url ? [listing.thumbnail_url] : undefined,
    },
    alternates: {
      canonical: `https://balivillatruth.com/listing/${slug}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Structured data (JSON-LD @graph = RealEstateListing + BreadcrumbList)
// ---------------------------------------------------------------------------
function buildJsonLd(listing: any, slug: string) {
  const priceUsd = Math.round(getPriceUSD(listing));
  const location = listing.location || "Bali";
  const niceName = toTitleCase(listing.villa_name || "");

  const realEstate = {
    "@type": "RealEstateListing",
    name: niceName,
    url: `https://balivillatruth.com/listing/${slug}`,
    description: `${listing.bedrooms}-bedroom villa in ${location}, Indonesia. Independent net yield audit by Bali Villa Truth.`,
    image: listing.thumbnail_url || undefined,
    offers: {
      "@type": "Offer",
      price: priceUsd,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: location,
      addressRegion: "Bali",
      addressCountry: "ID",
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Bedrooms", value: listing.bedrooms },
      { "@type": "PropertyValue", name: "Land Size", value: listing.land_size ? `${listing.land_size} m²` : "N/A" },
      { "@type": "PropertyValue", name: "Building Size", value: listing.building_size ? `${listing.building_size} m²` : "N/A" },
      { "@type": "PropertyValue", name: "Net Yield (Estimated)", value: listing.projected_roi ? `${Number(listing.projected_roi).toFixed(1)}%` : "N/A" },
      { "@type": "PropertyValue", name: "Tenure", value: listing.lease_years > 0 ? `Leasehold — ${listing.lease_years} years` : "Freehold" },
    ],
  };

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://balivillatruth.com" },
      { "@type": "ListItem", position: 2, name: `${location} Villa Investment`, item: `https://balivillatruth.com/${location.toLowerCase().replace(/\s+/g, "-")}` },
      { "@type": "ListItem", position: 3, name: niceName, item: `https://balivillatruth.com/listing/${slug}` },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [realEstate, breadcrumbs] };
}

// ---------------------------------------------------------------------------
// Server component (renders SEO-critical HTML)
// ---------------------------------------------------------------------------
export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  // Parallel fetch for comps + price history (non-blocking for the main audit)
  const [comps, priceHistory] = await Promise.all([
    getComps(listing, 3),
    getPriceHistory(listing.id),
  ]);

  const jsonLd = buildJsonLd(listing, slug);
  const niceName = toTitleCase(listing.villa_name || "");

  const priceUsd = Math.round(getPriceUSD(listing)) || null;
  const roi = listing.projected_roi
    ? Number(listing.projected_roi).toFixed(1)
    : null;
  const flags: string[] = listing.flags ? listing.flags.split(",").filter(Boolean) : [];
  const leaseType = listing.lease_years && listing.lease_years > 0 ? "Leasehold" : "Freehold";
  const leaseYears = listing.lease_years || 0;
  const nightlyRate = listing.est_nightly_rate || 0;
  const occupancy = listing.est_occupancy || 0.65;
  const occupancyPct = Math.round(occupancy * 100);
  const grossRevenue = nightlyRate * 365 * occupancy;
  const expenses = grossRevenue * 0.4;
  const netRevenue = grossRevenue - expenses;
  const leaseDepreciation = leaseYears > 0 && priceUsd ? priceUsd / leaseYears : 0;

  // Sensitivity grid: rows = nightly rate multiplier, cols = occupancy points
  const rateMultipliers = [0.85, 1.0, 1.15];
  const occPoints = [Math.max(20, occupancyPct - 15), occupancyPct, Math.min(95, occupancyPct + 15)];
  function yieldAt(rateMult: number, occPct: number): number | null {
    if (!priceUsd || priceUsd <= 0 || !nightlyRate) return null;
    const gross = nightlyRate * rateMult * 365 * (occPct / 100);
    const netRev = gross * 0.6; // after 40% expenses
    const adj = netRev - leaseDepreciation;
    return (adj / priceUsd) * 100;
  }

  // Price history: compute delta from first → current
  const priceHistSorted = priceHistory.slice().sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  const firstPrice = priceHistSorted[0]?.price_usd || null;
  const currentPrice = priceUsd;
  const priceDelta = firstPrice && currentPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : null;

  // Last audited timestamp
  const lastAuditedISO = listing.last_audited_at || listing.updated_at || listing.created_at || null;
  const lastAuditedRel = formatRelativeDate(lastAuditedISO);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)] font-sans">
        {/* Global StickyNav + SiteFooter are rendered by app/layout.tsx */}
        <main className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-16">
          {/* Breadcrumb trail */}
          <nav aria-label="Breadcrumb" className="text-[12px] text-[color:var(--bvt-ink-muted)] mb-8">
            <Link href="/" className="hover:text-[color:var(--bvt-ink)] transition-colors">Home</Link>
            <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
            <Link
              href={`/${(listing.location || "bali").toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-[color:var(--bvt-ink)] transition-colors"
            >
              {listing.location || "Bali"}
            </Link>
            <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
            <span className="text-[color:var(--bvt-ink)]">Audit</span>
          </nav>

          {/* HEADER — editorial masthead */}
          <header className="mb-10 md:mb-14">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">Audit dossier · {listing.location || "Bali"}</span>
            </div>
            <h1 className="font-display text-[color:var(--bvt-ink)] text-[34px] md:text-[46px] lg:text-[56px] leading-[1.02] tracking-[-0.02em] mb-5">
              {niceName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[color:var(--bvt-ink-muted)]">
              <span className="flex items-center gap-1">
                📍 {listing.location || "Bali"}
              </span>
              <span>•</span>
              <span>{listing.bedrooms} Bed{listing.bedrooms !== 1 ? "s" : ""}</span>
              {listing.beds_baths && (
                <>
                  <span>•</span>
                  <span>{listing.beds_baths}</span>
                </>
              )}
              <span>•</span>
              <span className={leaseType === "Freehold" ? "text-emerald-400" : "text-amber-400"}>
                {leaseType}{leaseYears > 0 ? ` (${leaseYears} years)` : ""}
              </span>
              {lastAuditedRel && (
                <>
                  <span>•</span>
                  <span title={lastAuditedISO || ""}>Last re-audited {lastAuditedRel}</span>
                </>
              )}
            </div>

            {/* FLAGS */}
            {flags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {flags.map((flag: string) => {
                  const key = flag.trim().toUpperCase().replace(/\s+/g, "_");
                  const meta = FLAG_LABELS[key] || { label: flag.replace(/_/g, " "), tone: "slate" as const, tip: "" };
                  const tone = meta.tone;
                  return (
                    <span
                      key={flag}
                      title={meta.tip}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full cursor-help ${
                        tone === "red"
                          ? "bg-red-900/50 text-red-300 border border-red-700"
                          : tone === "amber"
                          ? "bg-amber-900/50 text-amber-300 border border-amber-700"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {meta.label}
                    </span>
                  );
                })}
              </div>
            )}
          </header>

          {/* MAIN GRID */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* LEFT: Image + Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Thumbnail */}
              {listing.thumbnail_url && (
                <div className="rounded-xl overflow-hidden border border-slate-800">
                  <ThumbImg
                    src={listing.thumbnail_url}
                    alt={niceName}
                    className="w-full h-64 md:h-80 object-cover bg-[color:var(--bvt-bg-soft)]"
                    eager
                  />
                </div>
              )}

              {/* Price history (only if we have >1 observation) */}
              {priceHistSorted.length > 1 && firstPrice && currentPrice && (
                <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-3">Price history</h2>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">First tracked</div>
                      <div className="font-medium">${Math.round(firstPrice).toLocaleString("en-US")}</div>
                      <div className="text-[10px] text-slate-500">{new Date(priceHistSorted[0].recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                    <div className="text-slate-500">→</div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Now</div>
                      <div className="font-medium">${Math.round(currentPrice).toLocaleString("en-US")}</div>
                    </div>
                    {priceDelta !== null && (
                      <div className="ml-auto">
                        <div className={`text-xs uppercase tracking-wider mb-0.5 ${priceDelta < 0 ? "text-emerald-400" : "text-amber-400"}`}>Change</div>
                        <div className={`font-bold text-lg ${priceDelta < 0 ? "text-emerald-400" : "text-amber-400"}`}>
                          {priceDelta > 0 ? "+" : ""}{priceDelta.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                  {priceDelta !== null && priceDelta <= -5 && (
                    <p className="text-xs text-emerald-400 mt-3">
                      Price has dropped — potentially a motivated seller. Worth a conversation.
                    </p>
                  )}
                </section>
              )}

              {/* Property details */}
              <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-4">Property Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Location</span>
                    <span className="font-medium">{listing.location || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Bedrooms</span>
                    <span className="font-medium">{listing.bedrooms || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Beds / Baths</span>
                    <span className="font-medium">{listing.beds_baths || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Land Size</span>
                    <span className="font-medium">{listing.land_size ? `${listing.land_size} m²` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Building Size</span>
                    <span className="font-medium">{listing.building_size ? `${listing.building_size} m²` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Tenure</span>
                    <span className={`font-medium ${leaseType === "Freehold" ? "text-emerald-400" : "text-amber-400"}`}>
                      {leaseType}{leaseYears > 0 ? ` — ${leaseYears} yrs remaining` : ""}
                    </span>
                  </div>
                  {listing.price_per_room && listing.price_per_room > 0 && (
                    <div>
                      <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Price / Bedroom</span>
                      <span className="font-medium">${Math.round(listing.price_per_room).toLocaleString("en-US")}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Yield Breakdown */}
              <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-4">Net Yield Breakdown</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Our stress-test uses conservative assumptions applied uniformly to all {">"}2,000 listings.{" "}
                  <Link href="/methodology" className="text-[#d4943a] hover:text-[#e5a84d] underline">
                    Full methodology →
                  </Link>
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Estimated Nightly Rate</span>
                    <span className="font-medium">${nightlyRate}/night</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Occupancy (area estimate)</span>
                    <span className="font-medium">{occupancyPct}%</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Gross Revenue (annual)</span>
                    <span className="font-medium">${Math.round(grossRevenue).toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Standard Expenses (40%)</span>
                    <span className="font-medium text-red-400">−${Math.round(expenses).toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Net Revenue</span>
                    <span className="font-medium">${Math.round(netRevenue).toLocaleString("en-US")}</span>
                  </div>
                  {leaseDepreciation > 0 && (
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">
                        Lease Depreciation ({priceUsd?.toLocaleString("en-US")} ÷ {leaseYears} yrs)
                      </span>
                      <span className="font-medium text-amber-400">
                        −${Math.round(leaseDepreciation).toLocaleString("en-US")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 bg-slate-800/50 rounded-lg px-3 -mx-1">
                    <span className="font-bold">Estimated Net Yield</span>
                    <span className={`font-bold text-lg ${
                      Number(roi) >= 5 ? "text-emerald-400" : Number(roi) >= 0 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {roi}%
                    </span>
                  </div>
                </div>
              </section>

              {/* Sensitivity table */}
              {priceUsd && nightlyRate > 0 && (
                <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-2">Sensitivity analysis</h2>
                  <p className="text-xs text-slate-500 mb-4">
                    What happens to the net yield if our nightly rate is off by ±15%, or occupancy is different from the area estimate of {occupancyPct}%?
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left text-xs uppercase tracking-wider text-slate-500 font-semibold p-2"></th>
                          {occPoints.map((op) => (
                            <th key={op} className="text-center text-xs uppercase tracking-wider text-slate-500 font-semibold p-2">
                              Occ {op}%
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rateMultipliers.map((m) => {
                          const label = m === 1 ? "Est. rate" : m < 1 ? `Rate −15%` : `Rate +15%`;
                          return (
                            <tr key={m} className="border-t border-slate-800">
                              <td className="p-2 text-xs font-semibold text-slate-400">{label}</td>
                              {occPoints.map((op) => {
                                const y = yieldAt(m, op);
                                const color = y == null ? "text-slate-500" : y >= 5 ? "text-emerald-400" : y >= 0 ? "text-amber-400" : "text-red-400";
                                return (
                                  <td key={`${m}-${op}`} className={`p-2 text-center font-medium ${color}`}>
                                    {y == null ? "—" : `${y.toFixed(1)}%`}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3">
                    "Rate ±15%" stress-tests our nightly rate model. "Occ" rows are absolute occupancy points, not percentage-point shifts. The PDF audit extends this to a 5-year cashflow projection.
                  </p>
                </section>
              )}

              {/* Comparable listings */}
              {comps.length > 0 && (
                <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-2">Comparable {listing.location} {listing.bedrooms}-bed listings</h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Same area, same bedroom count — a quick sanity check on price and yield.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {comps.map((c: any) => {
                      const cPrice = Math.round(getPriceUSD(c));
                      const cName = toTitleCase(c.villa_name || "");
                      const cRoi = c.projected_roi ? Number(c.projected_roi).toFixed(1) : null;
                      return (
                        <Link
                          key={c.id}
                          href={`/listing/${c.slug}`}
                          className="block rounded-lg border border-slate-800 hover:border-[#d4943a] bg-slate-950/40 overflow-hidden transition-colors"
                        >
                          {c.thumbnail_url && (
                            <ThumbImg src={c.thumbnail_url} alt={cName} className="w-full h-28 object-cover bg-[color:var(--bvt-bg-soft)]" />
                          )}
                          <div className="p-3">
                            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                              {c.bedrooms} bed • {c.lease_years > 0 ? `Leasehold ${c.lease_years}y` : "Freehold"}
                            </div>
                            <div className="text-sm font-semibold line-clamp-2 mb-2">{cName}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">${cPrice.toLocaleString("en-US")}</span>
                              {cRoi !== null && (
                                <span className={`text-xs font-bold ${
                                  Number(cRoi) >= 5 ? "text-emerald-400" : Number(cRoi) >= 0 ? "text-amber-400" : "text-red-400"
                                }`}>
                                  {cRoi}%
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3">
                    <Link href={`/${(listing.location || "bali").toLowerCase().replace(/\s+/g, "-")}`} className="text-[#d4943a] underline hover:text-[#e5a84d]">
                      See all {listing.location} {listing.bedrooms}-bed listings →
                    </Link>
                  </p>
                </section>
              )}

              {/* Disclaimer */}
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg px-4 py-3 text-xs text-amber-400 leading-relaxed">
                <strong>Not financial advice.</strong> This is an automated stress-test using area-average nightly rates
                and estimated occupancy — not actual rental data for this specific property. All assumptions are shown above.
                Verify independently before investing.{" "}
                <Link href="/methodology" className="underline hover:text-amber-300">
                  Read our full methodology →
                </Link>
              </div>
            </div>

            {/* RIGHT: Price card + CTA */}
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 sticky top-16">
                <div className="text-center mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Asking Price</p>
                  <p className="text-3xl font-extrabold">
                    {priceUsd ? `$${priceUsd.toLocaleString("en-US")}` : "Price N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">USD</p>
                </div>

                <div className="text-center py-4 border-t border-b border-slate-800 mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Stress-Tested Net Yield</p>
                  <p className={`text-4xl font-extrabold ${
                    Number(roi) >= 5 ? "text-emerald-400" : Number(roi) >= 0 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {roi}%
                  </p>
                </div>

                {listing.land_size && (
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-slate-500">Price / m² (land)</span>
                    <span className="font-medium">
                      ${priceUsd && listing.land_size ? Math.round(priceUsd / Number(listing.land_size)).toLocaleString("en-US") : "—"}
                    </span>
                  </div>
                )}

                <ListingClient
                  sourceUrl={listing.url}
                  villaName={niceName}
                  listingId={listing.id}
                  slug={slug}
                />
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  className="text-sm text-[#d4943a] hover:text-[#e5a84d] underline transition-colors"
                >
                  Compare with other listings →
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Global SiteFooter renders via app/layout.tsx */}
      </div>
    </>
  );
}
