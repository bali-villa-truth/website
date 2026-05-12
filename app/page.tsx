import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import HomeClient from "./_components/HomeClient";

export const revalidate = 3600;

const SITE_URL = "https://balivillatruth.com";

export const metadata: Metadata = {
  title: "Bali Villa ROI Audits — Stress-Tested Net Yields",
  description:
    "Independent Bali villa ROI audits across 2,000+ listings. Stress-test net yield, occupancy, management fees, lease decay, and red flags before buying a villa in Bali.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Bali Villa ROI Audits — Stress-Tested Net Yields",
    description:
      "Independent net-yield audits for Bali villa investors. We don't sell villas — we check the math.",
    url: SITE_URL,
  },
};

const LISTING_FIELDS = [
  "id",
  "slug",
  "villa_name",
  "location",
  "last_price",
  "price_description",
  "bedrooms",
  "beds_baths",
  "land_size",
  "building_size",
  "lease_years",
  "features",
  "projected_roi",
  "est_nightly_rate",
  "est_occupancy",
  "flags",
  "rate_factors",
  "agent_claimed_rate",
  "rate_source",
  "thumbnail_url",
  "url",
  "previous_price",
  "latitude",
  "longitude",
].join(",");

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function dedupeListings(rows: any[]) {
  const seen = new Set<string>();
  const deduped: any[] = [];

  for (const row of rows) {
    const urlKey = (row.url || "").split("?")[0].trim().toLowerCase();
    const compositeKey = [
      (row.villa_name || "").trim().toLowerCase(),
      (row.location || "").trim().toLowerCase(),
      row.land_size || 0,
      row.building_size || 0,
      row.bedrooms || 0,
      row.lease_years || 0,
    ].join("|");
    const key = urlKey || compositeKey;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

async function getHomeSeedData() {
  const supabase = getSupabase();
  if (!supabase) {
    return { listings: [], totalCount: 0, flaggedCount: 0 };
  }

  const base = supabase
    .from("listings_tracker")
    .select("id", { count: "exact", head: true })
    .eq("status", "audited")
    .gt("last_price", 0)
    .not("slug", "is", null)
    .not("slug", "eq", "");

  const flagged = supabase
    .from("listings_tracker")
    .select("id", { count: "exact", head: true })
    .eq("status", "audited")
    .gt("last_price", 0)
    .not("slug", "is", null)
    .not("slug", "eq", "")
    .not("flags", "is", null)
    .not("flags", "eq", "");

  const featured = supabase
    .from("listings_tracker")
    .select(LISTING_FIELDS)
    .eq("status", "audited")
    .gt("last_price", 0)
    .not("slug", "is", null)
    .not("slug", "eq", "")
    .order("projected_roi", { ascending: false, nullsFirst: false })
    .limit(60);

  const [countResult, flaggedResult, featuredResult] = await Promise.all([
    base,
    flagged,
    featured,
  ]);

  if (countResult.error) {
    console.error("Homepage SEO seed: failed to count listings", countResult.error);
  }
  if (flaggedResult.error) {
    console.error("Homepage SEO seed: failed to count flagged listings", flaggedResult.error);
  }
  if (featuredResult.error) {
    console.error("Homepage SEO seed: failed to fetch featured listings", featuredResult.error);
  }

  return {
    listings: dedupeListings(featuredResult.data || []).slice(0, 50),
    totalCount: countResult.count || 0,
    flaggedCount: flaggedResult.count || 0,
  };
}

export default async function Page() {
  const { listings, totalCount, flaggedCount } = await getHomeSeedData();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured Bali villa ROI audits",
    numberOfItems: listings.length,
    itemListElement: listings.map((listing: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/listing/${listing.slug}`,
      name: listing.villa_name || `${listing.location || "Bali"} villa ROI audit`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <HomeClient
        initialListings={listings}
        initialTotalCount={totalCount}
        initialFlaggedCount={flaggedCount}
      />
    </>
  );
}
