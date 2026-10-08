import { createClient } from "@supabase/supabase-js";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ListingClient from "./ListingClient";
import ThumbImg from "@/app/_components/ThumbImg";
import MobileAuditBar from "@/app/_components/MobileAuditBar";
import { MATERIAL_PIPELINE_FLAGS } from "@/app/_lib/listingBrowse";

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

function modeledYield(listing: any): number | null {
  const raw = listing.projected_roi;
  if (raw == null || raw === "" || !(Number(listing.est_nightly_rate) > 0) ||
      String(listing.rate_source || "").startsWith("unmodeled_")) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function bedsBathsLabel(raw?: string | null): string {
  if (!raw?.trim()) return "Not stated";
  const parts = raw.match(/^(\d+)\s+Bed\s*\/\s*(\d+)\s+Bath$/i);
  if (!parts) return raw;
  const beds = Number(parts[1]);
  const baths = Number(parts[2]);
  return `${beds > 0 ? `${beds} Bed` : "Bedrooms not stated"} / ${baths > 0 ? `${baths} Bath` : "Bathrooms not stated"}`;
}

// Human-readable labels + tooltips for flags (aligns with /methodology page)
const FLAG_LABELS: Record<string, { label: string; tone: "red" | "amber" | "slate"; tip: string }> = {
  SHORT_LEASE: { label: "SHORT LEASE", tone: "amber", tip: "The source records fewer than 15 years remaining. A shorter term increases BVT's noncash lease-value allowance; verify the signed expiry and extension terms." },
  BUDGET_VILLA: { label: "BUDGET VILLA", tone: "amber", tip: "The asking price is low for the model tier or below the $50,000-per-bedroom screen. Check the reason for the price and whether the modeled nightly rate is supportable." },
  NEAR_BUDGET: { label: "NEAR BUDGET", tone: "slate", tip: "The asking price is near the lower end of the area and bedroom tier. This is a model-tier note, not a property defect; verify property-level bookings." },
  HIGH_YIELD: { label: "HIGH YIELD", tone: "amber", tip: "A high modeled gross yield needs independent rate, occupancy, cost, and asking-price evidence before it can be treated as achievable." },
  OPTIMISTIC_CLAIM: { label: "OPTIMISTIC CLAIM", tone: "amber", tip: "A high modeled gross yield can narrow after operating costs and any lease allowance. Request actual operating records." },
  INFLATED_ROI: { label: "HIGH MODEL YIELD", tone: "amber", tip: "The unadjusted modeled nightly rate implies more than 20% operating yield before any lease allowance. This is not a seller-reported result; check comparable rates and actual bookings." },
  OPTIMISTIC_ROI: { label: "ELEVATED MODEL YIELD", tone: "amber", tip: "The unadjusted modeled nightly rate implies more than 15% operating yield before any lease allowance. Test lower rates and occupancy." },
  RATE_PRICE_GAP: { label: "RATE / PRICE GAP", tone: "amber", tip: "At 65% occupancy, the modeled rate implies over 30% gross yield on an asking price below $200,000. Verify the asking price and property-level booking evidence." },
  OFF_PLAN: { label: "OFF PLAN", tone: "red", tip: "The source markets this listing as off-plan or pre-construction. BVT has not verified build status, approvals, delivery terms, or an operating rental history; check these independently." },
  EXTREME_BUDGET: { label: "EXTREME BUDGET", tone: "red", tip: "The asking price is far below the model tier. The nightly rate is heavily adjusted; investigate title, permits, condition, and comparable sales without assuming a particular defect." },
  MULTI_UNIT: { label: "UNIT-TYPE REVIEW", tone: "amber", tip: "The source title matches BVT's apartment, hospitality, or multiple-unit screen. This does not prove there is more than one rentable unit. Confirm the asset type, unit count, and what the asking price includes." },
  MULTI_UNIT_MODEL_UNSUPPORTED: { label: "MODEL NOT APPLIED", tone: "red", tip: "BVT withholds its single-villa ROI model for this title-based apartment, hospitality, or portfolio screen. Verify the asset type and obtain unit-level revenue, expense, and occupancy records before underwriting." },
  LEASE_TERM_NOT_STATED: { label: "LEASE TERM NOT STATED", tone: "amber", tip: "Source listing is leasehold but does not state the remaining lease term. Verify the actual term and extension price before underwriting." },
  BEDROOM_COUNT_NOT_STATED: { label: "BEDROOM COUNT NOT STATED", tone: "amber", tip: "Source listing does not expose a safe bedroom count. BVT does not model ROI until the bedroom/unit count is verified." },
  PHYSICAL_DATA_INCOMPLETE: { label: "PHYSICAL DATA INCOMPLETE", tone: "amber", tip: "Source listing is missing one or more physical specs such as bathrooms, land size, or building size." },
  NON_BALI_LOCATION: { label: "OUTSIDE BALI MODEL", tone: "amber", tip: "This source listing is outside Bali. BVT keeps it visible but does not model Bali villa ROI for it." },
  MISSING_DATA: { label: "DATA MISSING", tone: "amber", tip: "Important source details are unavailable. Confirm them before comparing price or relying on any estimate." },
  RATE_ADJUSTED: { label: "RATE ADJUSTED", tone: "amber", tip: "The modeled nightly rate differs from the base area rate. This is a model adjustment, not evidence of achieved rent." },
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
    .select("id, slug, villa_name, bedrooms, last_price, price_description, price_per_room, projected_roi, est_nightly_rate, rate_source, thumbnail_url, features, lease_years, land_size")
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

async function getPriceHistory(listingUrl: string | null | undefined) {
  if (!listingUrl) return [];
  const { data } = await supabase
    .from("price_history")
    .select("price_usd, recorded_at")
    .eq("listing_url", listingUrl)
    .order("recorded_at", { ascending: false })
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
  const yieldValue = modeledYield(listing);
  const roi = yieldValue !== null ? `${yieldValue.toFixed(1)}%` : "N/A";
  const beds = listing.bedrooms || "?";
  const location = listing.location || "Bali";
  const leaseType = tenureLabel(listing);
  const niceName = toTitleCase(listing.villa_name || "");

  // Title puts the villa name first so branded queries (people Googling the
  // listing's exact name the way BHI titles it) can match us. The differentiator
  // (audit · yield) lives in the tail; the "| Bali Villa Truth" brand suffix is
  // added automatically by the root layout's title template.
  const title = yieldValue !== null
    ? `${niceName} — Audit · ${roi} Net Yield`
    : `${niceName} — ROI Not Modeled`;
  const description = yieldValue !== null
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
  const yieldValue = modeledYield(listing);
  const bedrooms = Number(listing.bedrooms);
  const bedroomLabel = Number.isFinite(bedrooms) && bedrooms > 0 ? `${bedrooms}-bedroom ` : "";
  const scopeDescription = outsideBali
    ? "ROI not modeled: outside the Bali villa model scope."
    : yieldValue !== null
      ? "BVT provides an independent modeled net-yield review, not verified owner income."
      : "BVT has not modeled ROI for this asset.";

  const realEstate = {
    "@type": "RealEstateListing",
    name: niceName,
    url: `https://balivillatruth.com/listing/${slug}`,
    description: `${bedroomLabel}${yieldValue !== null ? "villa" : "property"} in ${location}, Indonesia. Source listing reviewed by Bali Villa Truth. ${scopeDescription}`,
    image: listing.thumbnail_url || undefined,
    address: {
      "@type": "PostalAddress",
      ...(outsideBali ? {} : { addressLocality: location, addressRegion: "Bali" }),
      addressCountry: "ID",
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Bedrooms", value: bedroomLabel ? bedrooms : "Not stated" },
      { "@type": "PropertyValue", name: "Land Size", value: listing.land_size ? `${listing.land_size} m²` : "N/A" },
      { "@type": "PropertyValue", name: "Building Size", value: listing.building_size ? `${listing.building_size} m²` : "N/A" },
      { "@type": "PropertyValue", name: "Net Yield (Estimated)", value: yieldValue !== null ? `${yieldValue.toFixed(1)}%` : "N/A" },
      { "@type": "PropertyValue", name: "Tenure", value: tenureSchemaValue(listing) },
      ...(priceUsd > 0 ? [{ "@type": "PropertyValue", name: "Audit price basis (USD)", value: priceUsd }] : []),
      { "@type": "PropertyValue", name: "Current availability", value: "Not verified by BVT" },
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
    getPriceHistory(listing.url),
  ]);

  const jsonLd = buildJsonLd(listing, slug);
  const niceName = toTitleCase(listing.villa_name || "");

  const priceUsd = Math.round(getPriceUSD(listing)) || null;
  const yieldValue = modeledYield(listing);
  const roi = yieldValue !== null ? yieldValue.toFixed(1) : null;
  const roiTone = yieldValue === null
    ? "text-slate-400"
    : yieldValue >= 5 ? "text-emerald-400" : yieldValue >= 0 ? "text-amber-400" : "text-red-400";
  const flags: string[] = listing.flags ? listing.flags.split(",").filter(Boolean) : [];
  const reviewFlags = flags.filter((flag) => MATERIAL_PIPELINE_FLAGS.some((material) => material === flag.trim().toUpperCase()));
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
  const roiDisplay = roi !== null ? `${roi}%` : "N/A";
  const rateSource = cleanSourceLabel(listing.rate_source, "BVT market-rate model");
  const occupancySource = cleanSourceLabel(listing.occupancy_source, "Area occupancy estimate");
  const usesAreaRateSample = (listing.rate_source || "").startsWith("bvt_market_model")
    && !(listing.rate_source || "").includes("fallback");
  const usesReviewDensityProxy = listing.occupancy_source === "review-density occupancy estimate";
  const paidAuditAvailable = Boolean(
    process.env.BVT_PAID_AUDIT_ENABLED === "1" &&
    process.env.STRIPE_SECRET_KEY?.trim() &&
    process.env.STRIPE_DEEP_AUDIT_PRICE_ID?.trim() &&
    process.env.RESEND_API_KEY?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );

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

  const priceHistSorted = priceHistory
    .filter((entry: any) => Number(entry.price_usd) > 0 && Number.isFinite(Date.parse(entry.recorded_at)))
    .sort((a: any, b: any) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at));
  const earlierLoggedPrice = Number(priceHistSorted[0]?.price_usd) || null;
  const latestLoggedPrice = Number(priceHistSorted[priceHistSorted.length - 1]?.price_usd) || null;
  const priceDelta = earlierLoggedPrice && latestLoggedPrice
    ? ((latestLoggedPrice - earlierLoggedPrice) / earlierLoggedPrice) * 100
    : null;

  // The source timestamp must not advance during a no-scrape model correction.
  const lastAuditedISO = listing.last_crawled_at || null;
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
              <span>{Number(listing.bedrooms) > 0 ? `${listing.bedrooms} Bed${Number(listing.bedrooms) !== 1 ? "s" : ""}` : "Bedroom count not stated"}</span>
              {listing.beds_baths && (
                <>
                  <span>•</span>
                  <span>{bedsBathsLabel(listing.beds_baths)}</span>
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
              {!lastAuditedRel && <span>Source check date not available</span>}
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

              {/* Price change log is keyed by source URL; old snapshots may be logged at detection time. */}
              {priceHistSorted.length > 1 && earlierLoggedPrice && latestLoggedPrice && (
                <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-1">Logged price change</h2>
                  <p className="text-xs text-slate-500 mb-3">Latest change logged {new Date(priceHistSorted[priceHistSorted.length - 1].recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Earlier logged USD basis</div>
                      <div className="font-medium">${Math.round(earlierLoggedPrice).toLocaleString("en-US")}</div>
                    </div>
                    <div className="hidden sm:block text-slate-500">→</div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Latest logged USD basis</div>
                      <div className="font-medium">${Math.round(latestLoggedPrice).toLocaleString("en-US")}</div>
                    </div>
                    {priceDelta !== null && (
                      <div className="sm:ml-auto">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">USD-basis difference</div>
                        <div className="font-bold text-lg text-slate-200">
                          {priceDelta > 0 ? "+" : ""}{priceDelta.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    The earlier value may be logged when a change is detected, not when it first appeared. USD equivalents can also move with exchange rates. Confirm the current source ask, currency, and availability before drawing a conclusion.
                  </p>
                </section>
              )}

              {/* Property details */}
              <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-4">Property Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Location</span>
                    <span className="font-medium">{listing.location || "Not stated"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Bedrooms</span>
                    <span className="font-medium">{Number(listing.bedrooms) > 0 ? listing.bedrooms : "Not stated"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Beds / Baths</span>
                    <span className="font-medium">{bedsBathsLabel(listing.beds_baths)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Land Size</span>
                    <span className="font-medium">{Number(listing.land_size) > 0 ? `${listing.land_size} m²` : "Not stated"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Building Size</span>
                    <span className="font-medium">{Number(listing.building_size) > 0 ? `${listing.building_size} m²` : "Not stated"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Tenure</span>
                    <span className={`font-medium ${leaseType === "Freehold" ? "text-emerald-400" : "text-amber-400"}`}>
                      {tenureDisplay}
                    </span>
                  </div>
                  {Number(listing.price_per_room) > 0 && (
                    <div>
                      <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Price / Bedroom</span>
                      <span className="font-medium">${Math.round(listing.price_per_room).toLocaleString("en-US")}</span>
                    </div>
                  )}
                </div>
                <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap gap-x-5 gap-y-3 text-xs">
                  <Link href={`/contact?listing=${encodeURIComponent(slug)}&reason=correction`} className="text-[color:var(--bvt-accent)] underline underline-offset-4 py-2">
                    Report a listing-data error
                  </Link>
                  <Link href={`/contact?listing=${encodeURIComponent(slug)}&reason=audit`} className="text-[color:var(--bvt-accent)] underline underline-offset-4 py-2">
                    Custom review enquiry
                  </Link>
                </div>
              </section>

              {/* Investor assumption notes */}
              <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-3">How to read this audit</h2>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {hasNightlyRate
                    ? "The headline net yield is BVT's modeled screening scenario, not verified rental performance or a promise. Compare the lower-rate, lower-occupancy and higher-cost cases below before relying on it."
                    : "This property is outside the supported ROI model. No rental rate, occupancy, or yield estimate is available; verify the asset and source details before making an investment case."}
                </p>
                {yieldValue === 0 && (
                  <p className="text-sm text-amber-300 mb-4 leading-relaxed">
                    The stored model rounds to 0.0% net yield. This is a modeled result, not missing data or a guarantee of breaking even. It includes the stated operating-cost screen and any noncash lease allowance; actual rental cash flow can differ.
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Gross yield</div>
                    <div className="font-mono text-lg text-[color:var(--bvt-ink)]">
                      {grossYield !== null ? `${grossYield.toFixed(1)}%` : "Not available"}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {hasNightlyRate
                        ? "Modeled revenue at 65% occupancy, before operating costs and any noncash lease allowance. Unoccupied nights are already reflected in the occupancy assumption."
                        : "No gross-yield calculation is made for this listing."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Net yield</div>
                    <div className={`font-mono text-lg ${roiTone}`}>
                      {roiDisplay}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {hasNightlyRate
                        ? `After the standard 40% operating-cost load${leaseDepreciation > 0 ? " and a noncash lease-value allowance" : ""}; before tax, financing, and major repairs.`
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
                    {hasNightlyRate && (
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                        Source-rate sample includes repeated result cards; distinct-property coverage is unverified.{' '}
                        <Link href="/methodology" className="text-[#d4943a] hover:text-[#e5a84d] underline underline-offset-2">
                          Review the rate limitation
                        </Link>
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Occupancy used in yield</div>
                    <div className="font-mono text-lg text-[color:var(--bvt-ink)]">{hasOccupancyModel ? `${occupancyPct}%` : "Not modeled"}</div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {hasOccupancyModel
                        ? `65% is BVT's shared screening assumption, not booked nights or an area market average. ${areaOccupancyPct !== null && usesReviewDensityProxy
                            ? `A separate ${areaOccupancyPct}% area proxy from 7 Mar 2026 review cards is provisional and is not used in the yield badge.`
                            : `${occupancySource} is not property-level evidence.`} Request verified channel-manager data and test a lower-occupancy case.`
                        : "No occupancy estimate is applied outside the supported villa model. Request verified booking history before estimating returns."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Lease-value allowance</div>
                    <div className="font-mono text-lg text-[color:var(--bvt-ink)]">
                      {leaseDepreciation > 0 ? `${money(leaseDepreciation)}/yr` : "Not modeled"}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {leaseDepreciation > 0
                        ? leaseTermNotStated
                          ? `Source lease term not stated. BVT uses an illustrative ${leaseYearsForMath}-year term for this noncash ROI allowance, not a verified expiry or resale forecast. Verify the signed term before investing.`
                          : `${sourceLeaseYears} years recorded as remaining. This noncash screening allowance is not a payment or resale forecast. Have extension rights and costs legally reviewed.`
                        : hasNightlyRate
                          ? "Modeled as freehold/no finite lease term in the source data."
                          : "The ROI model is not applied to this listing; verify any lease term independently."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Review flags</div>
                    <div className="font-mono text-lg text-[color:var(--bvt-ink)]">
                      {reviewFlags.length > 0 ? `${reviewFlags.length} to review` : "None surfaced"}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {reviewFlags.length > 0
                        ? "Review flags are diligence prompts, not automatic rejections or a safety rating."
                        : "No material review flags surfaced; legal, title, permit, and condition checks still matter."}
                    </p>
                    {flags.length > reviewFlags.length && (
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                        Other source/model markers below are not counted in the homepage review filter.
                      </p>
                    )}
                  </div>
                </div>
                {flags.length > 0 && (
                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <h3 className="text-sm font-semibold text-[color:var(--bvt-ink)] mb-3">What the source and model markers mean</h3>
                    <ul className="space-y-3">
                      {flags.map((flag: string) => {
                        const key = flag.trim().toUpperCase().replace(/\s+/g, "_");
                        const meta = FLAG_LABELS[key];
                        return (
                          <li key={flag} className="text-xs leading-relaxed">
                            <span className="font-semibold text-amber-300">{meta?.label || flag.replace(/_/g, " ")}: </span>
                            <span className="text-slate-400">{meta?.tip || "Confirm the source detail and its effect on the investment case before relying on this listing."}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <Link href="/guides/bali-villa-due-diligence-checklist" className="inline-block mt-4 text-xs text-[#d4943a] hover:text-[#e5a84d] underline">
                      Use the due diligence checklist →
                    </Link>
                  </div>
                )}
              </section>

              {/* Yield Breakdown */}
              <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-4">Net Yield Breakdown</h2>
                <p className="text-xs text-slate-500 mb-4">
                  {hasNightlyRate
                    ? "This baseline screening result applies stated assumptions to this listing; downside cases follow below. "
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
                    <span className="text-slate-400">Modeled gross revenue (annual)</span>
                    <span className="font-medium">{hasNightlyRate ? `$${Math.round(grossRevenue).toLocaleString("en-US")}` : "Not available"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Modeled operating-cost allowance (40%)</span>
                    <span className="font-medium text-red-400">{hasNightlyRate ? `−$${Math.round(expenses).toLocaleString("en-US")}` : "Not available"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Modeled rental income after operating costs</span>
                    <span className="font-medium">{hasNightlyRate ? `$${Math.round(netRevenue).toLocaleString("en-US")}` : "Not available"}</span>
                  </div>
                  {leaseDepreciation > 0 && (
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">
                        {leaseTermNotStated
                          ? `Noncash lease allowance (${priceUsd?.toLocaleString("en-US")} ÷ assumed ${leaseYearsForMath}yr term)`
                          : `Noncash lease allowance (${priceUsd?.toLocaleString("en-US")} ÷ ${sourceLeaseYears} yrs)`}
                      </span>
                      <span className="font-medium text-amber-400">
                        −${Math.round(leaseDepreciation).toLocaleString("en-US")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 bg-slate-800/50 rounded-lg px-3 -mx-1">
                    <span className="font-bold">Estimated Net Yield</span>
                    <span className={`font-bold text-lg ${roiTone}`}>
                      {roiDisplay}
                    </span>
                  </div>
                </div>
              </section>

              {/* Sensitivity table */}
              {priceUsd && nightlyRate > 0 && (
                <section id="sensitivity-analysis" className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-2">Sensitivity analysis</h2>
                  <p className="text-xs text-slate-500 mb-4">
                    What happens to net yield if the nightly rate is off by ±15%, or occupancy differs from the shared {occupancyPct}% scenario?
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <caption className="sr-only">Modeled net yield by nightly rate and occupancy scenario</caption>
                      <thead>
                        <tr>
                          <th scope="col" className="text-left text-xs uppercase tracking-wider text-slate-500 font-semibold p-2">Rate</th>
                          {occPoints.map((op) => (
                            <th key={op} scope="col" className="text-center text-xs uppercase tracking-wider text-slate-500 font-semibold p-2">
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
                              <th scope="row" className="p-2 text-left text-xs font-semibold text-slate-400">{label}</th>
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
                    "Rate ±15%" rows stress-test our nightly rate model. "Occ" column headings are occupancy levels, not percentage-point shifts. The free PDF shows a five-year modeled illustration, not verified owner cash flow.
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
                  <h2 className="font-display text-[22px] tracking-[-0.01em] text-[color:var(--bvt-ink)] mb-2">Other {listing.location} {listing.bedrooms}-bed asking listings</h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Same source-area label and bedroom count, not sold-property comparables. Recorded asking prices may be stale; tenure, condition, build stage, and modeled rate assumptions may differ. Review each dossier before comparing yields.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {comps.map((c: any) => {
                      const cPrice = Math.round(getPriceUSD(c));
                      const cName = toTitleCase(c.villa_name || "");
                      const cYield = modeledYield(c);
                      const cRoi = cYield !== null ? cYield.toFixed(1) : null;
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
                              <span className="text-xs text-slate-400">{cPrice > 0 ? `$${cPrice.toLocaleString("en-US")} USD basis` : "Price N/A"}</span>
                              {cRoi !== null ? (
                                <span className={`text-xs font-bold ${
                                  Number(cRoi) >= 5 ? "text-emerald-400" : Number(cRoi) >= 0 ? "text-amber-400" : "text-red-400"
                                }`}>
                                  {cRoi}% modeled
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">ROI N/A</span>
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

            {/* RIGHT: Price card + CTA. On desktop it stays beside the audit;
                on mobile it uses normal page scroll to keep every action reachable. */}
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 md:sticky md:top-[4.5rem] md:max-h-[calc(100vh-5.5rem)] md:overflow-y-auto sidebar-scroll">
                <div className="text-center mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Price basis for yield</p>
                  <p className="text-3xl font-extrabold">
                    {priceUsd ? `$${priceUsd.toLocaleString("en-US")}` : "Price N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{Number(listing.price_per_room) * Number(listing.bedrooms) > 0 ? "USD at audit FX" : "USD estimate"} · source ask: {listing.price_description || "not stated"}</p>
                </div>

                <div className="text-center py-4 border-t border-b border-slate-800 mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{yieldValue !== null ? "Modeled Net Yield" : "Net Yield Not Modeled"}</p>
                  <p className={`text-4xl font-extrabold ${roiTone}`}>
                    {roiDisplay}
                  </p>
                  {yieldValue !== null && (
                    <div className="mt-2 text-xs text-slate-400 leading-relaxed">
                      <p>65% occupancy · 40% operating-cost allowance{leaseDepreciation > 0 ? " · noncash lease allowance" : ""}</p>
                      <a href="#sensitivity-analysis" className="inline-block mt-2 text-[#d4943a] hover:text-[#e5a84d] underline underline-offset-2">View downside scenarios</a>
                    </div>
                  )}
                </div>

                {Number(listing.land_size) > 0 && (
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
                  paidAuditAvailable={paidAuditAvailable}
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
