import { createClient } from "@supabase/supabase-js";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ListingClient from "./ListingClient";

// Server-side Supabase client (uses service key for SSR, falls back to anon)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// Price stored in `last_price` may be in IDR (when >= 1M) or USD. Convert to USD.
// Falls back to current BI mid-rate (2026-04): 1 USD ≈ 16,782 IDR.
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

  const title = `${beds}-Bed ${location} Villa — ${priceUsd} | ${roi} Net Yield`;
  const description = `Independent audit: ${listing.villa_name}. ${beds}-bedroom ${leaseType.toLowerCase()} villa in ${location} listed at ${priceUsd}. Stress-tested net yield: ${roi} after 40% expenses. View full breakdown, flags, and comparable data.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://balivillatruth.com/listing/${slug}`,
      images: listing.thumbnail_url
        ? [{ url: listing.thumbnail_url, width: 800, height: 600, alt: listing.villa_name }]
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
// Structured data (JSON-LD)
// ---------------------------------------------------------------------------
function buildJsonLd(listing: any, slug: string) {
  const priceUsd = Math.round(getPriceUSD(listing));
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.villa_name,
    url: `https://balivillatruth.com/listing/${slug}`,
    description: `${listing.bedrooms}-bedroom villa in ${listing.location || "Bali"}, Indonesia. Independent net yield audit by Bali Villa Truth.`,
    image: listing.thumbnail_url || undefined,
    offers: {
      "@type": "Offer",
      price: priceUsd,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.location || "Bali",
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
}

// ---------------------------------------------------------------------------
// Server component (renders SEO-critical HTML)
// ---------------------------------------------------------------------------
export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const jsonLd = buildJsonLd(listing, slug);

  const priceUsd = Math.round(getPriceUSD(listing)) || null;
  const roi = listing.projected_roi
    ? Number(listing.projected_roi).toFixed(1)
    : null;
  const flags = listing.flags ? listing.flags.split(",").filter(Boolean) : [];
  const leaseType = listing.lease_years && listing.lease_years > 0 ? "Leasehold" : "Freehold";
  const leaseYears = listing.lease_years || 0;
  const nightlyRate = listing.est_nightly_rate || 0;
  const occupancy = listing.est_occupancy || 0.65;
  const occupancyPct = Math.round(occupancy * 100);
  const grossRevenue = nightlyRate * 365 * occupancy;
  const expenses = grossRevenue * 0.4;
  const netRevenue = grossRevenue - expenses;
  const leaseDepreciation = leaseYears > 0 && priceUsd ? priceUsd / leaseYears : 0;
  const netAfterLease = netRevenue - leaseDepreciation;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        {/* NAV */}
        <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-lg sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-extrabold tracking-tight">
              Bali Villa <span className="text-blue-400">Truth</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              ← Back to all listings
            </Link>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* HEADER */}
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
              {listing.villa_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
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
            </div>

            {/* FLAGS */}
            {flags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {flags.map((flag: string) => (
                  <span
                    key={flag}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      flag === "OFF_PLAN" || flag === "EXTREME_BUDGET"
                        ? "bg-red-900/50 text-red-300 border border-red-700"
                        : flag === "SHORT_LEASE" || flag === "MULTI_UNIT"
                        ? "bg-amber-900/50 text-amber-300 border border-amber-700"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {flag.replace(/_/g, " ")}
                  </span>
                ))}
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
                  <img
                    src={listing.thumbnail_url}
                    alt={listing.villa_name}
                    className="w-full h-64 md:h-80 object-cover"
                    loading="eager"
                  />
                </div>
              )}

              {/* Property details */}
              <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h2 className="text-lg font-bold mb-4">Property Details</h2>
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
                <h2 className="text-lg font-bold mb-4">Net Yield Breakdown</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Our stress-test uses conservative assumptions applied uniformly to all {">"}2,000 listings.{" "}
                  <Link href="/methodology" className="text-blue-400 hover:text-blue-300 underline">
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

                <ListingClient sourceUrl={listing.url} villaName={listing.villa_name} listingId={listing.id} />
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  Compare with other listings →
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="max-w-5xl mx-auto mt-16 pt-8 pb-6 border-t border-slate-800 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div>
              <span className="font-bold text-slate-300 text-sm">Bali Villa Truth</span>
              <span className="mx-2 text-slate-600">•</span>
              <span>Independent villa investment analysis</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/methodology" className="hover:text-blue-400 transition-colors">Methodology</Link>
              <span className="text-slate-600">|</span>
              <Link href="/" className="hover:text-blue-400 transition-colors">All Listings</Link>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-500 mt-4">
            © 2026 Bali Villa Truth. All projections are estimates and not financial advice.
          </p>
        </footer>
      </div>
    </>
  );
}
