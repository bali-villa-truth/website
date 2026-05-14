import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  isWebsiteDashboardToken,
} from "@/app/_lib/websiteDashboardAuth";

const SITE_URL = "https://balivillatruth.com";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CORE_PATHS = [
  { name: "Homepage audit ledger", path: "/", expect: ["Bali villa ROI audits", "/listing/"] },
  { name: "Methodology", path: "/methodology", expect: ["methodology", "40%"] },
  { name: "ROI guide", path: "/guides/bali-villa-roi", expect: ["Bali villa ROI", "FAQPage"] },
  { name: "Leasehold/freehold guide", path: "/guides/bali-villa-leasehold-vs-freehold-roi", expect: ["leasehold", "FAQPage"] },
  { name: "Due diligence guide", path: "/guides/bali-villa-due-diligence-checklist", expect: ["due diligence checklist", "FAQPage"] },
  { name: "Management fees guide", path: "/guides/bali-villa-management-fees", expect: ["Bali villa management fees", "FAQPage"] },
  { name: "SEO dashboard privacy", path: "/seo-dashboard", expect: ["SEO dashboard locked", "noindex"] },
  { name: "Website dashboard privacy", path: "/website-dashboard", expect: ["Website dashboard locked", "noindex"] },
  { name: "Robots", path: "/robots.txt", expect: ["Sitemap: https://balivillatruth.com/sitemap.xml"] },
  { name: "LLMs text", path: "/llms.txt", expect: ["Bali Villa Truth", "due diligence checklist"] },
];

const completedImprovements = [
  {
    date: "2026-05-14",
    area: "Investor education",
    title: "Bali villa management-fees and operating-cost guide",
    status: "Deployed this session",
    why: "Buyers now have a plain-English explanation of management fees, OTA costs, maintenance reserve, utilities, gross vs net ROI, and why BVT uses a conservative 40% operating-cost load.",
    url: `${SITE_URL}/guides/bali-villa-management-fees`,
    progressFile: ".tmp/website_progress_2026-05-14.md",
  },
  {
    date: "2026-05-13",
    area: "Investor navigation",
    title: "Homepage investor shortcuts and risk views",
    status: "Deployed this session",
    why: "Buyers can jump straight to best net yield, safer-looking dossiers, high-risk reviews, leasehold math, or the due diligence guide.",
    url: `${SITE_URL}/#listings-section`,
    progressFile: ".tmp/website_progress_2026-05-13.md",
  },
  {
    date: "2026-05-13",
    area: "Listing clarity",
    title: "ROI assumption notes on listing pages",
    status: "Deployed this session",
    why: "Listing audits now explain gross yield, net yield, nightly-rate source, occupancy source, operating-cost load, lease decay, and red flags in one place.",
    url: `${SITE_URL}/listing/2-units-villa-with-total-5-bedrooms-for-sale-freehold-in-pandawa-near-pandawa-beach-rf6636`,
    progressFile: ".tmp/website_progress_2026-05-13.md",
  },
  {
    date: "2026-05-13",
    area: "Investor education",
    title: "Bali villa due diligence checklist",
    status: "Deployed this session",
    why: "Adds an indexable buyer checklist covering ROI math, lease and ownership, permits, physical condition, and downside risk.",
    url: `${SITE_URL}/guides/bali-villa-due-diligence-checklist`,
    progressFile: ".tmp/website_progress_2026-05-13.md",
  },
  {
    date: "2026-05-13",
    area: "Operations",
    title: "Private website optimization dashboard",
    status: "Deployed this session",
    why: "Creates a private noindex progress dashboard separate from the SEO dashboard for broader site quality work.",
    url: `${SITE_URL}/website-dashboard`,
    progressFile: ".tmp/website_progress_2026-05-13.md",
  },
  {
    date: "2026-05-13",
    area: "SEO",
    title: "ROI guide cluster and protected SEO dashboard",
    status: "Live",
    why: "Main ROI guide, leasehold/freehold support guide, sitemap wiring, IndexNow, and private SEO dashboard were already shipped earlier today.",
    url: `${SITE_URL}/seo-dashboard`,
    progressFile: ".tmp/seo_progress_2026-05-13.md",
  },
];

const pendingImprovements = [
  {
    priority: "High",
    owner: "Data pipeline",
    title: "Expose confidence/provenance fields consistently across every listing",
    nextAction: "Normalize rate_source and occupancy_source labels upstream so 'auditor' never leaks to users or PDFs.",
  },
  {
    priority: "High",
    owner: "Authenticated GSC",
    title: "Request indexing for the new guide cluster and priority listings",
    nextAction: "Use Search Console UI when authenticated browser access is available; Indexing API is not valid for these URLs.",
  },
  {
    priority: "Medium",
    owner: "UX",
    title: "Add persistent compare summaries for saved villas",
    nextAction: "Consider a shareable comparison URL once user favorites have a stable server-side model.",
  },
  {
    priority: "Medium",
    owner: "Content",
    title: "Publish occupancy-rate guide",
    nextAction: "Build SSR guide from documented BVT occupancy modeling and verifiable public/source-backed market context.",
  },
];

const blockers = [
  {
    blocker: "GSC manual indexing",
    status: "Blocked by authenticated browser/tool access",
    note: "No deterministic Search Console submission script exists; local Google token is Sheets-only.",
  },
  {
    blocker: "Backlink outreach",
    status: "Blocked by user approval/account access",
    note: "Prepared outreach exists, but no third-party posting or emailing should happen without approval.",
  },
  {
    blocker: "Deep Audit paid checkout",
    status: "External setup required",
    note: "Stripe product, Vercel env vars, and Supabase paid_audits SQL remain user/account tasks from the prior handoff.",
  },
  {
    blocker: "Google Sheets push",
    status: "Blocked by expired OAuth token",
    note: "Supabase and site data are current; Sheets export needs interactive re-auth on the Mac.",
  },
];

const dataQualityIssues = [
  "Some listings still rely on model/auditor rate estimates rather than property-level booking exports.",
  "Occupancy is area/tier modeled unless a listing has stronger review-density provenance.",
  "Lease extension terms are not knowable from most source listings and must be verified manually.",
  "Pipeline labels should distinguish assumed, modeled, scraped, and verified inputs more clearly.",
];

const uxIssues = [
  "Homepage now has risk shortcuts, but comparison mode could still be easier to save and share.",
  "Mobile ledger needs continued visual checks after each filter or card-density change.",
  "Listing pages are clearer, but PDF templates should be aligned with the new assumption-note language.",
];

const scheduledJobs = [
  {
    id: "bvt-seo-gsc-checkpoint",
    cadence: "Every 6 hours",
    status: "Active",
    purpose: "SEO visibility, indexing queue, and public SERP checkpoint.",
  },
  {
    id: "bvt-website-optimization-checkpoint",
    cadence: "Every 6 hours",
    status: "Active",
    purpose: "Continue investor UX, data quality, dashboard, and content improvement passes.",
  },
  {
    id: "monthly-rate-scrape",
    cadence: "Monthly",
    status: "Scheduled outside dashboard",
    purpose: "Refresh market rates, listings, Supabase, and ROI calculations.",
  },
];

const contentPages = [
  { title: "Bali Villa ROI: 2026 Net Yield Guide for Buyers", url: `${SITE_URL}/guides/bali-villa-roi`, status: "Live" },
  { title: "Bali Villa Leasehold vs Freehold ROI", url: `${SITE_URL}/guides/bali-villa-leasehold-vs-freehold-roi`, status: "Live" },
  { title: "Bali Villa Due Diligence Checklist", url: `${SITE_URL}/guides/bali-villa-due-diligence-checklist`, status: "Live" },
  { title: "Bali Villa Management Fees and Operating Costs", url: `${SITE_URL}/guides/bali-villa-management-fees`, status: "Live" },
];

const nextActions = [
  "Verify the due diligence and management-fees guides are indexed or queued in GSC when access is available.",
  "Create an occupancy-rate guide using only documented assumptions and verifiable sources.",
  "Move rate/occupancy provenance cleanup upstream into execution scripts and PDF templates.",
  "Add shareable comparison or saved-list workflow after confirming lead/user data model.",
  "Rotate dashboard fallback passwords into Vercel environment variables.",
];

function count(pattern: RegExp, text: string) {
  return (text.match(pattern) || []).length;
}

function titleFrom(text: string) {
  return text.match(/<title>(.*?)<\/title>/i)?.[1] || "";
}

async function fetchText(path: string) {
  const url = path.startsWith("http") ? path : `${SITE_URL}${path}`;
  const started = Date.now();
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "BVT Website Dashboard/1.0",
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
  if (!isWebsiteDashboardToken(token)) {
    return Response.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const [sitemap, ...coreResponses] = await Promise.all([
    fetchText("/sitemap.xml"),
    ...CORE_PATHS.map((item) => fetchText(item.path)),
  ]);

  const coreChecks = CORE_PATHS.map((item, index) => {
    const response = coreResponses[index];
    const missing = item.expect.filter((needle) => !response.text.includes(needle));
    return {
      name: item.name,
      url: response.url,
      ok: response.ok && missing.length === 0,
      status: response.status,
      ms: response.ms,
      title: response.title,
      detail: missing.length === 0 ? "Expected markers found." : `Missing: ${missing.join(", ")}`,
    };
  });

  const homepage = coreResponses[0]?.text || "";
  const sitemapUrls = count(/<loc>/g, sitemap.text);
  const healthOk = coreChecks.filter((check) => check.ok).length;
  const investorShortcuts = count(/Investor starting points|Best net yield|Safer-looking|High-risk review|Leasehold math/g, homepage);

  return Response.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      summary: {
        completedCount: completedImprovements.length,
        pendingCount: pendingImprovements.length,
        blockerCount: blockers.length,
        contentPages: contentPages.length,
        sitemapUrls,
        healthOk,
        healthTotal: coreChecks.length,
        investorShortcuts,
        currentFocus: "Investor clarity, risk navigation, data provenance, and private progress tracking.",
      },
      coreChecks,
      completedImprovements,
      pendingImprovements,
      scheduledJobs,
      blockers,
      dataQualityIssues,
      uxIssues,
      investorValueImprovements: [
        "Homepage explains that BVT is an independent audit bureau, not a broker.",
        "Risk shortcuts help users find best ROI, safer-looking, high-risk, and leasehold-only paths.",
        "Listing pages separate gross yield from net yield and show assumption provenance.",
        "New due diligence guide gives buyers a plain-English pre-offer checklist.",
        "New management-fees guide explains the 40% operating-cost load and the gap between brochure ROI and owner net yield.",
      ],
      mobileUsabilityChecks: [
        "Mobile filter panel remains collapsible and now includes risk view.",
        "Investor shortcut cards stack into single-column controls on narrow screens.",
        "Listing page assumption notes use a one-column mobile grid before moving to two columns.",
      ],
      styleDesignImprovements: [
        "Kept the dark editorial BVT palette and small-data-tool visual language.",
        "Used restrained hairline cards, compact labels, and investor-focused copy.",
        "Avoided broker-style hype and framed outputs as estimates, not guarantees.",
      ],
      performanceChecks: [
        "Homepage still SSRs a seed set and hydrates the full ledger client-side.",
        "Dashboard APIs use no-store and short fetch timeouts so private checks do not cache stale status.",
        "Sitemap count is read live from /sitemap.xml.",
      ],
      contentPages,
      nextActions,
      progressFiles: [
        ".tmp/website_progress_2026-05-13.md",
        ".tmp/website_progress_2026-05-14.md",
        ".tmp/seo_progress_2026-05-13.md",
        ".tmp/gsc_indexing_results_2026-05-13.md",
      ],
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
