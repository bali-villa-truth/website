import { cookies } from "next/headers";
import { COOKIE_NAME, isDashboardToken } from "@/app/_lib/seoDashboardAuth";

const SITE_URL = "https://balivillatruth.com";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HUBS = [
  "canggu",
  "berawa",
  "pererenan",
  "uluwatu",
  "bingin",
  "seminyak",
  "ubud",
  "sanur",
  "ungasan",
  "nusa-dua",
];

const KEYWORDS = [
  {
    keyword: "bali villa roi",
    intent: "Primary buyer-intent keyword",
    status: "Observed",
    bestObservedPage: 12,
    bestObservedRange: "111-120",
    bestObservedUrl: `${SITE_URL}/ubud`,
    bestObservedTitle: "Ubud Villa Investment ROI — Independent Yield Audits",
    source: "User Google screenshot, 2026-05-13 1:02 PM",
    nextAction: "Submit Ubud and ROI guides in GSC; monitor every 6 hours.",
  },
  {
    keyword: "bali villa investment",
    intent: "Research and commercial investigation",
    status: "Needs check",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-roi`,
    bestObservedTitle: "Bali Villa ROI: 2026 Net Yield Guide for Buyers",
    source: "Tracking target created; no verified rank yet.",
    nextAction: "Use ROI guide and location hubs as topical cluster.",
  },
  {
    keyword: "bali villa",
    intent: "Very broad top-of-funnel search",
    status: "Needs check",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: SITE_URL,
    bestObservedTitle: "Bali Villa ROI Audits — Stress-Tested Net Yields",
    source: "Tracking target created; no verified rank yet.",
    nextAction: "Treat as long-term authority keyword, not a near-term win.",
  },
  {
    keyword: "bali villa for sale",
    intent: "High-volume transactional search",
    status: "Needs check",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: SITE_URL,
    bestObservedTitle: "Bali Villa ROI Audits — Stress-Tested Net Yields",
    source: "Tracking target created; no verified rank yet.",
    nextAction: "Location hubs and listing pages should support this over time.",
  },
  {
    keyword: "bali villa net yield",
    intent: "BVT-specific differentiation keyword",
    status: "Prepared",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-roi`,
    bestObservedTitle: "Bali Villa ROI: 2026 Net Yield Guide for Buyers",
    source: "Content and internal links shipped; awaiting indexation.",
    nextAction: "Track once the ROI guide is indexed.",
  },
  {
    keyword: "bali villa leasehold vs freehold roi",
    intent: "Long-tail due-diligence keyword",
    status: "Prepared",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-leasehold-vs-freehold-roi`,
    bestObservedTitle: "Bali Villa Leasehold vs Freehold ROI — Real Yield Impact",
    source: "Support guide shipped 2026-05-13; awaiting indexation.",
    nextAction: "Submit guide in GSC and monitor impressions.",
  },
  {
    keyword: "ubud villa investment roi",
    intent: "Location-specific ROI keyword",
    status: "Observed",
    bestObservedPage: 12,
    bestObservedRange: "111-120",
    bestObservedUrl: `${SITE_URL}/ubud`,
    bestObservedTitle: "Ubud Villa Investment ROI — Independent Yield Audits",
    source: "Same Google screenshot showed the Ubud hub for the broader ROI query.",
    nextAction: "Keep Ubud linked to ROI guides and request indexing.",
  },
  {
    keyword: "bali villa due diligence checklist",
    intent: "Buyer risk and verification keyword",
    status: "Prepared",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-due-diligence-checklist`,
    bestObservedTitle: "Bali Villa Due Diligence Checklist: 25 Red Flags",
    source: "Guide shipped 2026-05-13; awaiting indexation.",
    nextAction: "Submit guide in GSC and link from ROI, listing, and homepage investor paths.",
  },
  {
    keyword: "bali villa management fees",
    intent: "Operating-cost and net-yield validation keyword",
    status: "Prepared",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-management-fees`,
    bestObservedTitle: "Bali Villa Management Fees and Operating Costs",
    source: "Guide shipped 2026-05-14; awaiting indexation.",
    nextAction: "Submit guide in GSC and keep linked from ROI guide, due diligence guide, footer, llms.txt, and sitemap.",
  },
];

const JOBS = [
  {
    id: "bvt-seo-gsc-checkpoint",
    name: "BVT SEO visibility loop",
    cadence: "Every 6 hours",
    status: "Active",
    owner: "Codex automation",
    lastKnownRun: "Configured 2026-05-13",
    nextAction: "Recheck SERP visibility, site health, GSC queue, and content opportunities.",
  },
  {
    id: "gsc-indexing-queue",
    name: "Google Search Console indexing queue",
    cadence: "Manual when browser/GSC access is available",
    status: "Blocked",
    owner: "GSC UI",
    lastKnownRun: "Last successful manual pass 2026-05-12",
    nextAction: "Submit /nusa-dua, ROI guide, leasehold/freehold guide, /ubud, then flagship listings.",
  },
  {
    id: "indexnow-submit",
    name: "IndexNow URL pings",
    cadence: "After each SEO deploy",
    status: "Healthy",
    owner: "BVT API route",
    lastKnownRun: "Accepted HTTP 200 on 2026-05-13",
    nextAction: "Continue pinging changed guides, hubs, and sitemap after deploys.",
  },
  {
    id: "monthly-rate-scrape",
    name: "Monthly rate/data refresh",
    cadence: "Monthly",
    status: "Scheduled outside SEO dashboard",
    owner: "Local pipeline",
    lastKnownRun: "2026-05-01",
    nextAction: "Next rate scrape around 2026-06-01.",
  },
];

const GSC_QUEUE = [
  `${SITE_URL}/nusa-dua`,
  `${SITE_URL}/guides/bali-villa-roi`,
  `${SITE_URL}/guides/bali-villa-leasehold-vs-freehold-roi`,
  `${SITE_URL}/guides/bali-villa-due-diligence-checklist`,
  `${SITE_URL}/guides/bali-villa-management-fees`,
  `${SITE_URL}/ubud`,
  `${SITE_URL}/listing/2-units-villa-with-total-5-bedrooms-for-sale-freehold-in-pandawa-near-pandawa-beach-rf6636`,
  `${SITE_URL}/listing/cozy-3-bedroom-villa-for-sale-leasehold-and-yearly-rent-in-kutuh-rf6460`,
  `${SITE_URL}/listing/3-unit-of-beautiful-tropical-house-for-sale-leasehold-in-uluwatu-rf8008`,
  `${SITE_URL}/listing/3-bedroom-family-villa-for-sale-freehold-in-bali-nusa-dua-fm131`,
];

function count(pattern: RegExp, text: string) {
  return (text.match(pattern) || []).length;
}

function titleFrom(text: string) {
  return text.match(/<title>(.*?)<\/title>/i)?.[1] || "";
}

async function fetchText(pathOrUrl: string) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
  const started = Date.now();
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "BVT SEO Dashboard/1.0",
      },
      signal: AbortSignal.timeout(9000),
    });
    const text = await response.text();
    return {
      url,
      ok: response.ok,
      status: response.status,
      ms: Date.now() - started,
      text,
      title: titleFrom(text),
      error: null as string | null,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      ms: Date.now() - started,
      text: "",
      title: "",
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!isDashboardToken(token)) {
    return Response.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const [
    home,
    roiGuide,
    leaseGuide,
    dueDiligenceGuide,
    managementGuide,
    sitemap,
    robots,
    llms,
    ...hubResponses
  ] = await Promise.all([
    fetchText("/"),
    fetchText("/guides/bali-villa-roi"),
    fetchText("/guides/bali-villa-leasehold-vs-freehold-roi"),
    fetchText("/guides/bali-villa-due-diligence-checklist"),
    fetchText("/guides/bali-villa-management-fees"),
    fetchText("/sitemap.xml"),
    fetchText("/robots.txt"),
    fetchText("/llms.txt"),
    ...HUBS.map((hub) => fetchText(`/${hub}`)),
  ]);

  const hubs = hubResponses.map((hub, index) => ({
    slug: HUBS[index],
    url: hub.url,
    ok: hub.ok,
    status: hub.status,
    ms: hub.ms,
    listingLinks: count(/\/listing\/[^" ]+/g, hub.text),
    roiGuideLinks: count(/\/guides\/bali-villa-roi/g, hub.text),
    leaseGuideLinks: count(/\/guides\/bali-villa-leasehold-vs-freehold-roi/g, hub.text),
    methodSections: count(/How .*? ROI is stress-tested/g, hub.text),
  }));

  const checks = [
    {
      name: "Homepage SSR crawl graph",
      url: home.url,
      ok: home.ok && count(/\/listing\/[^" ]+/g, home.text) >= 50 && count(/No properties match your filters/g, home.text) === 0,
      status: home.status,
      ms: home.ms,
      detail: `${count(/\/listing\/[^" ]+/g, home.text)} listing links, ${count(/No properties match your filters/g, home.text)} empty-state matches`,
    },
    {
      name: "ROI guide",
      url: roiGuide.url,
      ok: roiGuide.ok && count(/Article|FAQPage|BreadcrumbList/g, roiGuide.text) >= 3,
      status: roiGuide.status,
      ms: roiGuide.ms,
      detail: roiGuide.title,
    },
    {
      name: "Leasehold/freehold guide",
      url: leaseGuide.url,
      ok: leaseGuide.ok && count(/Article|FAQPage|BreadcrumbList/g, leaseGuide.text) >= 3,
      status: leaseGuide.status,
      ms: leaseGuide.ms,
      detail: leaseGuide.title,
    },
    {
      name: "Due diligence guide",
      url: dueDiligenceGuide.url,
      ok: dueDiligenceGuide.ok && count(/Article|FAQPage|BreadcrumbList/g, dueDiligenceGuide.text) >= 3,
      status: dueDiligenceGuide.status,
      ms: dueDiligenceGuide.ms,
      detail: dueDiligenceGuide.title,
    },
    {
      name: "Management fees guide",
      url: managementGuide.url,
      ok: managementGuide.ok && count(/Article|FAQPage|BreadcrumbList/g, managementGuide.text) >= 3,
      status: managementGuide.status,
      ms: managementGuide.ms,
      detail: managementGuide.title,
    },
    {
      name: "Sitemap",
      url: sitemap.url,
      ok: sitemap.ok && count(/<loc>/g, sitemap.text) >= 2200,
      status: sitemap.status,
      ms: sitemap.ms,
      detail: `${count(/<loc>/g, sitemap.text)} URLs`,
    },
    {
      name: "Robots",
      url: robots.url,
      ok: robots.ok && robots.text.includes("Sitemap:"),
      status: robots.status,
      ms: robots.ms,
      detail: robots.text.includes("Disallow: /api/") ? "Allows crawlers, protects API paths" : "Needs review",
    },
    {
      name: "llms.txt",
      url: llms.url,
      ok: llms.ok && llms.text.includes("/guides/bali-villa-roi"),
      status: llms.status,
      ms: llms.ms,
      detail: `${count(/guides\/bali-villa/g, llms.text)} guide references`,
    },
  ];

  const indexed = 1236;
  const notIndexed = 1012;
  const totalKnown = indexed + notIndexed;

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      site: SITE_URL,
      rankProvider: {
        mode: "manual-observation",
        note:
          "Exact live Google ranks require GSC access or a SERP API key. This dashboard shows verified observations plus live site-health signals.",
      },
      summary: {
        healthChecksPassing: checks.filter((check) => check.ok).length,
        healthChecksTotal: checks.length,
        hubCount: hubs.length,
        hubsWithRoiLinks: hubs.filter((hub) => hub.roiGuideLinks > 0).length,
        hubsWithLeaseLinks: hubs.filter((hub) => hub.leaseGuideLinks > 0).length,
        sitemapUrls: count(/<loc>/g, sitemap.text),
        indexed,
        notIndexed,
        indexedPercent: totalKnown ? Math.round((indexed / totalKnown) * 100) : 0,
        bestObservedKeyword: "bali villa roi",
        bestObservedPage: 12,
        automationCadence: "Every 6 hours",
      },
      keywords: KEYWORDS,
      jobs: JOBS,
      gsc: {
        status: "Blocked until authenticated Search Console UI access is available",
        indexed,
        notIndexed,
        clicks: 35,
        queue: GSC_QUEUE,
        accounts: [
          "sc-domain:balivillatruth.com under michael.schvarcz@gmail.com",
          "https://balivillatruth.com/ URL-prefix under michael@balivillatruth.com",
        ],
      },
      checks,
      hubs,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
