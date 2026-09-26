import { createClient } from "@supabase/supabase-js";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ListingClient from "./ListingClient";
import ThumbImg from "@/app/_components/ThumbImg";
import MobileAuditBar from "@/app/_components/MobileAuditBar";

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

function cleanSourceLabel(value?: string | null, fallback = "BVT model estimate"): string {
  const raw = (value || "").trim();
  if (!raw) return fallback;
  const normalized = raw.toLowerCase();
  if (normalized === "auditor") return "BVT audited market estimate";
  if (normalized === "bvt_market_model") return "BVT market-rate estimate";
  if (normalized === "bvt_market_model_near_budget") return "BVT market-rate estimate with near-budget caution";
  if (normalized === "bvt_market_model_budget_discount") return "BVT market-rate estimate with budget adjustment";
  if (normalized === "bvt_market_model_extreme_budget_discount") return "BVT market-rate estimate with extreme-budget adjustment";
  if (normalized === "bvt_market_model_fallback") return "BVT fallback market-rate estimate (no exact area model)";
  if (normalized === "bvt_market_model_fallback_near_budget") return "BVT fallback market-rate estimate with near-budget caution (no exact area model)";
  if (normalized === "bvt_market_model_fallback_budget_discount") return "BVT fallback market-rate estimate with budget adjustment (no exact area model)";
  if (normalized === "bvt_market_model_fallback_extreme_budget_discount") return "BVT fallback market-rate estimate with extreme-budget adjustment (no exact area model)";
  if (normalized === "unmodeled_missing_bedrooms") return "Not modeled: bedroom/unit count not verified";
  if (normalized === "unmodeled_non_bali_location") return "Not modeled: outside Bali model scope";
  if (normalized === "unmodeled_multi_unit") return "Not modeled: non-villa, multi-unit, or hospitality asset";
  if (normalized === "review-density occupancy estimate") return "Review-density occupancy estimate";
  if (normalized === "flat fallback occupancy assumption" || normalized === "flat (65%)") return "Flat fallback occupancy assumption";
  if (normalized.startsWith("review-based")) return "Review-density occupancy estimate";
  return raw
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^review-based/i, "Review-density model");
}

function money(value: number | null | undefined): string {
  if (!value || !Number.isFinite(value)) return "Not available";
  return `$${Math.round(value).toLocaleString("en-US")}`;
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
  MULTI_UNIT_MODEL_UNSUPPORTED: { label: "MODEL NOT APPLIED", tone: "red", tip: "BVT does not apply its single-villa ROI model to apartment/penthouse units, hotels, resorts, apartment buildings, or villa portfolios without verified unit-level revenue and expense data." },
  LEASE_TERM_NOT_STATED: { label: "LEASE TERM NOT STATED", tone: "amber", tip: "Source listing is leasehold but does not state the remaining lease term. Verify the actual term and extension price before underwriting." },
  BEDROOM_COUNT_NOT_STATED: { label: "BEDROOM COUNT NOT STATED", tone: "amber", tip: "Source listing does not expose a safe bedroom count. BVT does not model ROI until the bedroom/unit count is verified." },
  PHYSICAL_DATA_INCOMPLETE: { label: "PHYSICAL DATA INCOMPLETE", tone: "amber", tip: "Source listing is missing one or more physical specs such as bathrooms, land size, or building size." },
  NON_BALI_LOCATION: { label: "OUTSIDE BALI MODEL", tone: "amber", tip: "This source listing is outside Bali. BVT keeps it visible but does not model Bali villa ROI for it." },
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
    .select("id, slug, villa_name, bedrooms, last_price, price_description, price_per_room, projected_roi, thumbnail_url, features, lease_years, land_size")
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

// Keep metadata, schema, comps, and on-page yield on the stored audit USD basis.
// Unmodeled listings use source-currency conversion only when no audit basis exists.
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
  const auditPrice = Number(listing.price_per_room) * Number(listing.bedrooms);
  if (auditPrice > 0) return auditPrice;
  const { amount, currency } = parseListingPrice(listing);
  const r = FALLBACK_RATES[currency];
  if (!r || r <= 0) return amount;
  return currency === "USD" ? amount : amount / r;
}

function isLeaseholdListing(listing: any): boolean {
  const features = String(listing.features || "").toLowerCase();
  const years = Number(listing.lease_years) || 0;
  return features.includes("leasehold") || features.includes("hak sewa") || (years > 0 && years < 999);
}

function isFreeholdListing(listing: any): boolean {
  const features = String(listing.features || "").toLowerCase();
  const years = Number(listing.lease_years) || 0;
  return features.includes("freehold") || features.includes("hak milik") || years === 999;
}

function tenureLabel(listing: any): string {
  const years = Number(listing.lease_years) || 0;
  if (isLeaseholdListing(listing)) {
    return years > 0 ? `Leasehold (${years}yr)` : "Leasehold (term not stated)";
  }
  if (isFreeholdListing(listing)) return "Freehold";
  return "Tenure not stated";
}

function tenureSchemaValue(listing: any): string {
  const years = Number(listing.lease_years) || 0;
  if (isLeaseholdListing(listing)) {
    return years > 0 ? `Leasehold — ${years} years` : "Leasehold — term not stated";
  }
  if (isFreeholdListing(listing)) return "Freehold";
  return "Tenure not stated";
}

const LOCATION_HUB_SLUGS = new Set([
  "canggu", "berawa", "pererenan", "uluwatu", "bingin",
  "seminyak", "ubud", "sanur", "ungasan", "nusa-dua",
]);

function locationHub(location: string): { href: string; label: string } {
  const slug = location.toLowerCase().trim().replace(/\s+/g, "-");
  return LOCATION_HUB_SLUGS.has(slug)
    ? { href: `/${slug}`, label: location }
    : { href: "/#listings-section", label: "Browse audits" };
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
  const leaseType = tenureLabel(listing);
  const niceName = toTitleCase(listing.villa_name || "");

  // Title puts the villa name first so branded queries (people Googling the
  // listing's exact name the way BHI titles it) can match us. The differentiator
  // (audit · yield) lives in the tail; the "| Bali Villa Truth" brand suffix is
  // added automatically by the root layout's title template.
  const title = listing.projected_roi
    ? `${niceName} — Audit · ${roi} Net Yield`
    : `${niceName} — ROI Not Modeled`;
  const description = listing.projected_roi
    ? `Independent audit: ${niceName}. ${beds}-bedroom ${leaseType.toLowerCase()} villa in ${location}, analyzed at ${priceUsd} at audit FX. Estimated net yield: ${roi} under a 65% occupancy scenario after 40% operating costs and any lease decay. Review the assumptions.`
    : `Source listing review: ${niceName} in ${location}, USD price equivalent ${priceUsd}. BVT has not modeled ROI for this asset; check the listing's scope and diligence flags before estimating returns.`;

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
  const outsideBali = String(listing.rate_source || "").includes("non_bali") || location === "Other Indonesian Islands";
  const hub = locationHub(location);

  const realEstate = {
    "@type": "RealEstateListing",
    name: niceName,
    url: `https://balivillatruth.com/listing/${slug}`,
    description: outsideBali
      ? `${listing.bedrooms}-bedroom property in ${location}, Indonesia. Bali villa ROI model not applied.`
      : `${listing.bedrooms}-bedroom villa in ${location}, Indonesia. Independent net yield audit by Bali Villa Truth.`,
    image: listing.thumbnail_url || undefined,
    offers: {
      "@type": "Offer",
      price: priceUsd,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      ...(outsideBali ? {} : { addressLocality: location, addressRegion: "Bali" }),
      addressCountry: "ID",
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Bedrooms", value: listing.bedrooms },
      { "@type": "PropertyValue", name: "Land Size", value: listing.land_size ? `${listing.land_size} m²` : "N/A" },
      { "@type": "PropertyValue", name: "Building Size", value: listing.building_size ? `${listing.building_size} m²` : "N/A" },
      { "@type": "PropertyValue", name: "Net Yield (Estimated)", value: listing.projected_roi ? `${Number(listing.projected_roi).toFixed(1)}%` : "N/A" },
      { "@type": "PropertyValue", name: "Tenure", value: tenureSchemaValue(listing) },
    ],
  };

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://balivillatruth.com" },
      { "@type": "ListItem", position: 2, name: hub.label, item: `https://balivillatruth.com${hub.href}` },
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
  const sourceLeaseYears = Number(listing.lease_years) || 0;
  const leaseTermNotStated = flags.includes("LEASE_TERM_NOT_STATED") || (isLeaseholdListing(listing) && sourceLeaseYears === 0);
  const leaseType = isLeaseholdListing(listing)
    ? "Leasehold"
    : isFreeholdListing(listing)
      ? "Freehold"
      : "Tenure not stated";
  const tenureDisplay = tenureLabel(listing);
  const leaseYearsForMath = leaseTermNotStated ? 15 : sourceLeaseYears;
  const nightlyRate = listing.est_nightly_rate || 0;
  const hasNightlyRate = nightlyRate > 0;
  const occupancy = 0.65;
  const occupancyPct = Math.round(occupancy * 100);
  const areaOccupancyPct = listing.est_occupancy != null ? Math.round(Number(listing.est_occupancy) * 100) : null;
  const hasOccupancyModel = hasNightlyRate && occupancy > 0;
  const grossRevenue = nightlyRate * 365 * occupancy;
  const expenses = grossRevenue * 0.4;
  const netRevenue = grossRevenue - expenses;
  const leaseDepreciation = hasNightlyRate && leaseYearsForMath > 0 && priceUsd ? priceUsd / leaseYearsForMath : 0;
  const grossYield = priceUsd && grossRevenue > 0 ? (grossRevenue / priceUsd) * 100 : null;
  const roiDisplay = roi ? `${roi}%` : "N/A";
  const rateSource = cleanSourceLabel(listing.rate_source, "BVT market-rate model");
  const occupancySource = cleanSourceLabel(listing.occupancy_source, "Area occupancy estimate");
  const usesAreaRateSample = (listing.rate_source || "").startsWith("bvt_market_model")
    && !(listing.rate_source || "").includes("fallback");
  const usesReviewDensityProxy = listing.occupancy_source === "review-density occupancy estimate";

  // Sensitivity grid: rows = nightly rate multiplier, cols = occupancy points
  const rateMultipliers = [0.85, 1.0, 1.15];
  const occPoints = [Math.max(20, occupancyPct - 15), occupancyPct, Math.min(95, occupancyPct + 15)];
  function yieldAt(rateMult: number, occPct: number, expenseRatio = 0.4): number | null {
    if (!priceUsd || priceUsd <= 0 || !nightlyRate) return null;
    const gross = nightlyRate * rateMult * 365 * (occPct / 100);
    const netRev = gross * (1 - expenseRatio);
    const adj = netRev - leaseDepreciation;
    return (adj / priceUsd) * 100;
  }
  const combinedDownsideYield = yieldAt(0.85, 50, 0.5);

  // Price history: compute delta from first → current
  const priceHistSorted = priceHistory.slice().sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  const firstPrice = priceHistSorted[0]?.price_usd || null;
  const currentPrice = priceUsd;
  const priceDelta = firstPrice && currentPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : null;

  // The source timestamp must not advance during a no-scrape model correction.
  const lastAuditedISO = listing.last_crawled_at || listing.last_audited_at || listing.updated_at || listing.created_at || null;
  const lastAuditedRel = formatRelativeDate(lastAuditedISO);
  const hub = locationHub(listing.location || "Bali");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)] font-sans">
        {/* Global StickyNav + SiteFooter are rendered by app/layout.tsx */}
        <main className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-28 md:pb-16">
          {/* Breadcrumb trail */}
          <nav aria-label="Breadcrumb" className="text-[12px] text-[color:var(--bvt-ink-muted)] mb-8">
            <Link href="/" className="hover:text-[color:var(--bvt-ink)] transition-colors">Home</Link>
            <span className="mx-2 text-[color:var(--bvt-ink-faint)]">/</span>
            <Link
              href={hub.href}
              className="hover:text-[color:var(--bvt-ink)] transition-colors"
            >
              {hub.label}
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
                {tenureDisplay}
              </span>
              {lastAuditedRel && (
                <>
                  <span>•</span>
                  <span title={lastAuditedISO || ""}>Source checked {lastAuditedRel}</span>
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
                      {tenureDisplay}
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

              {/* Investor assumption notes */}
              <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-3">How to read this audit</h2>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {hasNightlyRate
                    ? "BVT treats the ROI number as a stress-tested estimate, not a promise. Check whether the assumptions survive negotiation, lower occupancy, and lease decay."
                    : "This property is outside the supported ROI model. No rental rate, occupancy, or yield estimate is available; verify the asset and source details before making an investment case."}
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Gross yield</div>
                    <div className="font-mono text-lg text-[color:var(--bvt-ink)]">
                      {grossYield !== null ? `${grossYield.toFixed(1)}%` : "Not available"}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Revenue before management, OTA fees, maintenance, utilities, vacancy, and lease decay.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Net yield</div>
                    <div className={`font-mono text-lg ${
                      Number(roi) >= 5 ? "text-emerald-400" : Number(roi) >= 0 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {roiDisplay}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {hasNightlyRate
                        ? `After the standard 40% operating-cost load${leaseDepreciation > 0 ? " and annual lease depreciation" : ""}.`
                        : "No net-yield calculation is made for this listing."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nightly rate</div>
                    <div className="font-mono text-lg text-[color:var(--bvt-ink)]">
                      {hasNightlyRate ? `$${nightlyRate}/night` : "Not available"}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {rateSource}. {usesAreaRateSample
                        ? "Area/bedroom asking-rate sample: Booking.com, collected 1 Aug 2026 for 3 Nov 2026 stays. Not booked revenue."
                        : "No exact area/bedroom rate sample is available for this estimate."} Verify property-level booking history before relying on it.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Occupancy used in yield</div>
                    <div className="font-mono text-lg text-[color:var(--bvt-ink)]">{hasOccupancyModel ? `${occupancyPct}%` : "Not modeled"}</div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {hasOccupancyModel
                        ? `65% is a common comparison scenario, not booked nights. ${areaOccupancyPct !== null && usesReviewDensityProxy
                            ? `A separate ${areaOccupancyPct}% area proxy from 7 Mar 2026 review cards is provisional and is not used in the yield badge.`
                            : `${occupancySource} is not property-level evidence.`} Request verified channel-manager data and test a lower-occupancy case.`
                        : "No occupancy estimate is applied outside the supported villa model. Request verified booking history before estimating returns."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Lease decay</div>
                    <div className="font-mono text-lg text-[color:var(--bvt-ink)]">
                      {leaseDepreciation > 0 ? `${money(leaseDepreciation)}/yr` : "Not modeled"}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {leaseDepreciation > 0
                        ? leaseTermNotStated
                          ? `Source lease term not stated. BVT uses a conservative ${leaseYearsForMath}-year internal assumption for the ROI stress test; verify the actual term before investing.`
                          : `${sourceLeaseYears} years remaining. Extension claims should be written, priced, and legally reviewed.`
                        : hasNightlyRate
                          ? "Modeled as freehold/no finite lease term in the source data."
                          : "The ROI model is not applied to this listing; verify any lease term independently."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Red flags</div>
                    <div className="font-mono text-lg text-[color:var(--bvt-ink)]">
                      {flags.length > 0 ? `${flags.length} flagged` : "None surfaced"}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {flags.length > 0
                        ? "Flags are prompts for diligence, not automatic rejections."
                        : "No material pipeline flags surfaced, but legal, title, permit, and condition checks still matter."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Yield Breakdown */}
              <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-4">Net Yield Breakdown</h2>
                <p className="text-xs text-slate-500 mb-4">
                  {hasNightlyRate
                    ? "This stress-test applies stated assumptions to this listing. "
                    : "BVT has not modeled ROI for this listing; the figures below are unavailable until the asset is in scope. "}
                  <Link href="/methodology" className="text-[#d4943a] hover:text-[#e5a84d] underline">
                    Full methodology →
                  </Link>
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Estimated Nightly Rate</span>
                    <span className="font-medium">{hasNightlyRate ? `$${nightlyRate}/night` : "Not available"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Occupancy (shared scenario)</span>
                    <span className="font-medium">{hasOccupancyModel ? `${occupancyPct}%` : "Not modeled"}</span>
                  </div>
                  {grossYield !== null && (
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Gross Yield (before costs)</span>
                      <span className="font-medium text-slate-300">{grossYield.toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Gross Revenue (annual)</span>
                    <span className="font-medium">{hasNightlyRate ? `$${Math.round(grossRevenue).toLocaleString("en-US")}` : "Not available"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Standard Expenses (40%)</span>
                    <span className="font-medium text-red-400">{hasNightlyRate ? `−$${Math.round(expenses).toLocaleString("en-US")}` : "Not available"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Net Revenue (before lease decay)</span>
                    <span className="font-medium">{hasNightlyRate ? `$${Math.round(netRevenue).toLocaleString("en-US")}` : "Not available"}</span>
                  </div>
                  {leaseDepreciation > 0 && (
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">
                        {leaseTermNotStated
                          ? `Lease Depreciation (${priceUsd?.toLocaleString("en-US")} ÷ conservative ${leaseYearsForMath}yr assumption)`
                          : `Lease Depreciation (${priceUsd?.toLocaleString("en-US")} ÷ ${sourceLeaseYears} yrs)`}
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
                      {roiDisplay}
                    </span>
                  </div>
                </div>
              </section>

              {/* Sensitivity table */}
              {priceUsd && nightlyRate > 0 && (
                <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-2">Sensitivity analysis</h2>
                  <p className="text-xs text-slate-500 mb-4">
                    What happens to net yield if the nightly rate is off by ±15%, or occupancy differs from the shared {occupancyPct}% scenario?
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
                  <div className="mt-5 border-t border-slate-800 pt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-xl">
                      <h3 className="text-sm font-semibold text-[color:var(--bvt-ink)]">Combined downside screen</h3>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        50% occupancy, a 15% lower nightly rate, and 50% operating costs, with the same purchase-price basis and lease allowance. This is an illustrative scenario, not a forecast.
                      </p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <div className={`font-mono text-xl font-semibold ${combinedDownsideYield !== null && combinedDownsideYield < 0 ? "text-red-400" : "text-amber-400"}`}>
                        {combinedDownsideYield !== null ? `${combinedDownsideYield.toFixed(1)}%` : "Not available"}
                      </div>
                      <div className="text-[11px] text-slate-500">modeled net yield</div>
                    </div>
                  </div>
                  {leaseDepreciation > 0 && (
                    <p className="text-[11px] text-slate-500 mt-3">
                      The lease allowance is noncash; a negative screening yield does not by itself mean negative rental cash flow.
                    </p>
                  )}
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
                              {c.bedrooms} bed • {tenureLabel(c)}
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
                    <Link href={hub.href} className="text-[#d4943a] underline hover:text-[#e5a84d]">
                      {hub.label === "Browse audits" ? "Browse all listing reviews →" : `See more ${listing.location} listings →`}
                    </Link>
                  </p>
                </section>
              )}

              {/* Disclaimer */}
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg px-4 py-3 text-xs text-amber-400 leading-relaxed">
                <strong>Not financial advice.</strong>{" "}
                {hasNightlyRate
                  ? "This is an automated stress-test using modeled nightly rates and estimated occupancy, not actual rental data for this property. Verify every assumption independently. "
                  : "BVT has not modeled rental yield for this asset. The source details and flags are for screening only; request verified rental, title, and lease evidence before investing. "}
                <Link href="/methodology" className="underline hover:text-amber-300">
                  Read our full methodology →
                </Link>
              </div>
            </div>

            {/* RIGHT: Price card + CTA
                The card is taller than a typical viewport (price + yield +
                actions + email form + Deep Audit). We keep the whole block
                visible as the user scrolls the main column by pinning it
                (sticky top-[4.5rem]) and giving it an internal scroll when it
                exceeds the viewport (max-h + overflow-y-auto). `sidebar-scroll`
                is a hairline-styled scrollbar defined in globals.css. */}
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 sticky top-[4.5rem] max-h-[calc(100vh-5.5rem)] overflow-y-auto sidebar-scroll">
                <div className="text-center mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Price basis for yield</p>
                  <p className="text-3xl font-extrabold">
                    {priceUsd ? `$${priceUsd.toLocaleString("en-US")}` : "Price N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{Number(listing.price_per_room) * Number(listing.bedrooms) > 0 ? "USD at audit FX" : "USD estimate"} · source ask: {listing.price_description || "not stated"}</p>
                </div>

                <div className="text-center py-4 border-t border-b border-slate-800 mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Stress-Tested Net Yield</p>
                  <p className={`text-4xl font-extrabold ${
                    Number(roi) >= 5 ? "text-emerald-400" : Number(roi) >= 0 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {roiDisplay}
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
                  modeled={hasNightlyRate}
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

        {/* Mobile-only sticky bottom CTA bar — rendered at page root, OUTSIDE
            <main>'s sidebar subtree, because iOS Safari traps position:fixed
            inside any overflow:auto ancestor (the desktop sticky sidebar uses
            overflow-y-auto). Hidden at md+ where the sticky sidebar already
            keeps the Deep Audit visible. */}
        {hasNightlyRate && <MobileAuditBar />}

        {/* Global SiteFooter renders via app/layout.tsx */}
      </div>
    </>
  );
}
