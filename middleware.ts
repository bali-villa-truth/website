import { NextRequest, NextResponse } from "next/server";

/**
 * Domain redirect middleware
 *
 * Catches requests coming to our secondary/defensive domains and 301s them to
 * the canonical balivillatruth.com with UTM params for attribution in GA4.
 *
 * Why middleware (not Vercel dashboard "redirect to primary"):
 *  - Lets us append ?utm_source=<domain> so Google Analytics shows which
 *    redirect domain drove the visit (otherwise it looks like direct traffic).
 *  - Single source of truth in code, reviewable in git.
 *
 * To activate a domain:
 *  1. Add it in Vercel → Project → Settings → Domains (as an alias, NOT as
 *     "redirect to primary" — we want requests to reach this middleware).
 *  2. Point its DNS to Vercel (CNAME to cname.vercel-dns.com, or A record
 *     76.76.21.21 for apex).
 *  3. Add an entry below.
 */
const REDIRECT_MAP: Record<string, string> = {
  "balivillaleasehold.com": "leasehold",
  "balivillacompliance.com": "compliance",
  "balileaseholdpro.com": "leaseholdpro",
  "balizoningcheck.com": "zoning",
  "uluwatudealvalidator.com": "uluwatu",
  "balivillavalidator.com": "validator",
  "balivillaaudit.com": "audit",
  "baliroicalculator.com": "roicalculator",
};

const PRIMARY_DOMAIN = "https://balivillatruth.com";

export function middleware(request: NextRequest) {
  const rawHost = (request.headers.get("host") || "").toLowerCase();
  // Strip port, then strip leading www. so "www.foo.com" and "foo.com" match.
  const host = rawHost.split(":")[0].replace(/^www\./, "");

  const utmSource = REDIRECT_MAP[host];
  if (!utmSource) {
    return NextResponse.next();
  }

  // Preserve the path and existing query string on the way through.
  const incoming = request.nextUrl;
  const target = new URL(incoming.pathname + incoming.search, PRIMARY_DOMAIN);

  // Only set UTM params if the request didn't already carry them
  // (so paid-campaign links through these domains keep their own attribution).
  if (!target.searchParams.has("utm_source")) {
    target.searchParams.set("utm_source", utmSource);
    target.searchParams.set("utm_medium", "domain_redirect");
    target.searchParams.set("utm_campaign", "defensive_branding");
  }

  return NextResponse.redirect(target, 301);
}

export const config = {
  // Run on everything except Next.js internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|opengraph-image|sitemap.xml|robots.txt).*)"],
};
