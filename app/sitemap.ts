import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://balivillatruth.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static pages
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/methodology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Dynamic listing pages — fetch all slugs from Supabase
  try {
    const { data: listings } = await supabase
      .from("listings_tracker")
      .select("slug, last_crawled_at")
      .eq("status", "audited")
      .not("slug", "is", null)
      .not("slug", "eq", "");

    if (listings) {
      for (const listing of listings) {
        routes.push({
          url: `${SITE_URL}/listing/${listing.slug}`,
          lastModified: listing.last_crawled_at || now,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch (e) {
    // If Supabase fetch fails, sitemap still works with static pages
    console.error("Sitemap: failed to fetch listings", e);
  }

  return routes;
}
