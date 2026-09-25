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
    status: "GSC measured",
    bestObservedPage: 12,
    bestObservedRange: "111-120",
    bestObservedUrl: `${SITE_URL}/ubud`,
    bestObservedTitle: "Ubud Villa Investment ROI — Independent Yield Audits",
    source: "GSC URL-prefix, Jun 24-Sep 23: 27 impressions, 0 clicks, average position 53.5. Page-12 screenshot is historical (May 13).",
    gscAveragePosition: 53.5,
    gscImpressions: 27,
    nextAction: "ROI guide was queued Sep 25; recheck indexing and exact-query impressions in 7-14 days.",
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
    status: "Live; rank unverified",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-roi`,
    bestObservedTitle: "Bali Villa ROI: 2026 Net Yield Guide for Buyers",
    source: "ROI guide is live but GSC showed it was not indexed on Sep 25; indexing requested.",
    nextAction: "Reinspect the guide in 7-14 days and track query impressions.",
  },
  {
    keyword: "bali villa leasehold vs freehold roi",
    intent: "Long-tail due-diligence keyword",
    status: "Live; rank unverified",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-leasehold-vs-freehold-roi`,
    bestObservedTitle: "Bali Villa Leasehold vs Freehold ROI — Real Yield Impact",
    source: "Support guide live; current GSC indexing and rank unverified.",
    nextAction: "Submit guide in GSC and monitor impressions.",
  },
  {
    keyword: "ubud villa investment roi",
    intent: "Location-specific ROI keyword",
    status: "Historical observation",
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
    status: "Live; rank unverified",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-due-diligence-checklist`,
    bestObservedTitle: "Bali Villa Due Diligence Checklist: 25 Red Flags",
    source: "Guide live; current GSC indexing and rank unverified.",
    nextAction: "Submit guide in GSC and link from ROI, listing, and homepage investor paths.",
  },
  {
    keyword: "bali villa management fees",
    intent: "Operating-cost and net-yield validation keyword",
    status: "Live; rank unverified",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-management-fees`,
    bestObservedTitle: "Bali Villa Management Fees and Operating Costs",
    source: "Guide live; current GSC indexing and rank unverified.",
    nextAction: "Submit guide in GSC and keep linked from ROI guide, due diligence guide, footer, llms.txt, and sitemap.",
  },
  {
    keyword: "bali villa occupancy rates",
    intent: "Rental-demand and ROI assumption keyword",
    status: "Live; rank unverified",
    bestObservedPage: null,
    bestObservedRange: null,
    bestObservedUrl: `${SITE_URL}/guides/bali-villa-occupancy-rates`,
    bestObservedTitle: "Bali Villa Occupancy Rates: ROI Stress Test",
    source: "Guide live on 2026-09-25; public rank and GSC index status have not been verified.",
    nextAction: "Inspect in GSC after the two priority URLs and track occupancy-query impressions.",
  },
];

const JOBS = [
  {
    id: "bvt-seo-gsc-checkpoint",
    name: "BVT SEO visibility loop",
    cadence: "Every 6 hours",
    status: "Active",
    owner: "Codex automation",
    lastKnownRun: "Active; prompt updated 2026-09-25",
    nextAction: "Recheck SERP visibility, site health, GSC queue, and content opportunities.",
  },
  {
    id: "gsc-indexing-queue",
    name: "Google Search Console indexing queue",
    cadence: "Manual recheck in 7-14 days",
    status: "Completed",
    owner: "GSC UI",
    lastKnownRun: "Sep 25: 16 URLs inspected; 11 queued, 5 already indexed",
    nextAction: "Reinspect ROI guide and /nusa-dua, then compare sitemap discovery and exact-query impressions.",
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
    status: "Schedule needs verification",
    owner: "Local pipeline",
    lastKnownRun: "2026-05-01",
    nextAction: "Confirm the monthly rate-source job before reporting its next run.",
  },
];

const GSC_QUEUE = [
  `${SITE_URL}/nusa-dua`,
  `${SITE_URL}/guides/bali-villa-roi`,
  `${SITE_URL}/listing/brand-new-2-bedroom-villa-for-sale-in-bali-canggu-padonan-rf2647`,
  `${SITE_URL}/listing/2-bedroom-villa-for-sale-in-ubud-rf11027`,
  `${SITE_URL}/listing/3-bedroom-tropical-villa-for-sale-walking-distance-to-sanur-beach-rf3853a`,
  `${SITE_URL}/listing/modern-2-bedroom-villa-for-sale-in-bali-seminyak-rf6368`,
  `${SITE_URL}/listing/brand-new-2-bedroom-villa-for-sale-in-bali-pererenan-rf5666b`,
  `${SITE_URL}/listing/brand-new-4-bedroom-family-villa-for-sale-and-rent-in-berawa-rf9016`,
  `${SITE_URL}/listing/3-bedroom-tropical-villa-for-sale-and-rent-in-balangan-kt029`,
  `${SITE_URL}/listing/3-bedroom-family-villa-for-sale-freehold-in-bali-nusa-dua-fm131`,
  `${SITE_URL}/listing/beautiful-2-bedrooms-villa-for-sale-in-kutuh-near-pandawa-beach-fm072a`,
  `${SITE_URL}/listing/brand-new-3-bedroom-villa-for-sale-freehold-in-bali-tanah-lot-rf2023`,
  `${SITE_URL}/listing/brand-new-2-bedrooms-villa-for-sale-freehold-in-kutuh-near-pandawa-beach-rf6021`,
  `${SITE_URL}/listing/wonderful-3-bedroom-villa-for-sale-rent-in-bali-seminyak-al107`,
  `${SITE_URL}/listing/beautiful-2-bedrooms-brand-new-villa-for-sale-and-rent-in-bali-canggu-padonan-rf8643`,
  `${SITE_URL}/listing/3-bedroom-villa-for-sale-in-bali-pererenan-tumbak-bayuh-rf3403`,
];

const GSC_QUEUE_STATES = [
  "Queued", "Queued", "Queued", "Queued", "Indexed", "Queued", "Queued", "Queued",
  "Queued", "Indexed", "Indexed", "Queued", "Indexed", "Indexed", "Queued", "Queued",
];

const GSC_AFTER_DEPLOY_QUEUE: string[] = [];

function count(pattern: RegExp, text: string) {
  return (text.match(pattern) || []).length;
}

function uniqueListingPaths(text: string) {
  const matches = text.match(/\/listing\/[^"'<>\s)]+/g) || [];
  return Array.from(
    new Set(matches.map((path) => path.replace(/[?#].*$/, "")))
  );
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
    occupancyGuide,
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
    fetchText("/guides/bali-villa-occupancy-rates"),
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
    listingLinks: uniqueListingPaths(hub.text).length,
    roiGuideLinks: count(/\/guides\/bali-villa-roi/g, hub.text),
    leaseGuideLinks: count(/\/guides\/bali-villa-leasehold-vs-freehold-roi/g, hub.text),
    methodSections: count(/How .*? ROI is stress-tested/g, hub.text),
  }));
  const homepageListingLinks = uniqueListingPaths(home.text).length;
  const homepageEmptyStates = count(/No properties match your filters/g, home.text);

  const checks = [
    {
      name: "Homepage SSR crawl graph",
      url: home.url,
      ok: home.ok && homepageListingLinks >= 20 && homepageEmptyStates === 0,
      status: home.status,
      ms: home.ms,
      detail: `${homepageListingLinks} distinct listing paths, ${homepageEmptyStates} empty-state matches`,
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
      name: "Occupancy rates guide",
      url: occupancyGuide.url,
      ok:
        occupancyGuide.ok && count(/Article|FAQPage|BreadcrumbList/g, occupancyGuide.text) >= 3,
      status: occupancyGuide.status,
      ms: occupancyGuide.ms,
      detail: occupancyGuide.title,
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

  const indexed = 581;
  const notIndexed = 1725;
  const totalKnown = indexed + notIndexed;

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      site: SITE_URL,
      rankProvider: {
        mode: "dated-gsc-snapshot",
        note:
          "GSC URL-prefix metrics were read Sep 25, with page indexing last updated Sep 20 and Web performance through Sep 23. Average position is a period aggregate, not a current Google rank. The May page-12 screenshot remains historical; site-health signals are fetched live.",
      },
      summary: {
        healthChecksPassing: checks.filter((check) => check.ok).length,
        healthChecksTotal: checks.length,
        hubCount: hubs.length,
        hubsWithRoiLinks: hubs.filter((hub) => hub.roiGuideLinks > 0).length,
        hubsWithLeaseLinks: hubs.filter((hub) => hub.leaseGuideLinks > 0).length,
        homepageListingLinks,
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
        status: "Sep 25: all 16 current-queue URLs inspected; 11 indexing requests confirmed and 5 already indexed. ROI guide and /nusa-dua are not indexed yet. Sitemap resubmitted; Google's last read still shows Jun 27.",
        lastKnownMetricsDate: "2026-09-25",
        indexingDataDate: "2026-09-20",
        performanceThrough: "2026-09-23",
        indexed,
        notIndexed,
        crawledNotIndexed: 1470,
        notFound: 251,
        clicks: 4,
        impressions: 701,
        averagePosition: 40.7,
        recent28Days: { clicks: 0, impressions: 121, averagePosition: 58.9 },
        exactQuery: {
          keyword: "bali villa roi",
          clicks: 0,
          impressions: 27,
          averagePosition: 53.5,
          recent28DayImpressions: 0,
        },
        queue: [],
        inspectedQueue: GSC_QUEUE.map((url, index) => ({ url, status: GSC_QUEUE_STATES[index] })),
        afterDeployQueue: GSC_AFTER_DEPLOY_QUEUE,
        accounts: [
          "https://balivillatruth.com/ URL-prefix accessible under michael.schvarcz@gmail.com",
          "sc-domain:balivillatruth.com returned access error under this account on Sep 25",
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
