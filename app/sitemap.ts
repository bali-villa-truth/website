import { MetadataRoute } from "next";

const SITE_URL = "https://balivillatruth.com";

// Bali areas tracked by BVT — used for future location pages
const AREAS = [
  "canggu",
  "seminyak",
  "uluwatu",
  "bingin",
  "pererenan",
  "berawa",
  "sanur",
  "seseh",
  "tabanan",
  "ubud",
  "nusa-dua",
  "north-bali",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

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

  // Uncomment when location pages are created:
  // for (const area of AREAS) {
  //   routes.push({
  //     url: `${SITE_URL}/${area}`,
  //     lastModified: now,
  //     changeFrequency: "weekly",
  //     priority: 0.7,
  //   });
  // }

  // Uncomment when guide/blog pages are created:
  // const guides = [
  //   "bali-villa-leasehold-vs-freehold-roi",
  //   "bali-villa-management-fees",
  //   "is-buying-villa-bali-worth-it",
  //   "bali-villa-due-diligence-checklist",
  //   "bali-villa-occupancy-rates-by-area",
  // ];
  // for (const slug of guides) {
  //   routes.push({
  //     url: `${SITE_URL}/guides/${slug}`,
  //     lastModified: now,
  //     changeFrequency: "monthly",
  //     priority: 0.6,
  //   });
  // }

  return routes;
}
