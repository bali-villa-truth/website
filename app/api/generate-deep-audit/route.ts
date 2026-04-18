/**
 * /api/generate-deep-audit?session_id=cs_xxx
 *
 * Called by the /deep-audit/success page after Stripe redirects back from
 * hosted checkout. Flow:
 *
 *   1. Retrieve checkout session from Stripe; verify status='complete' and
 *      payment_status='paid'. Reject if not.
 *   2. Read villa_id + email from session.metadata.
 *   3. Idempotency: check paid_audits table. If a row exists for this
 *      session_id, return early with 'already_sent' so page refreshes
 *      don't re-email.
 *   4. Fetch villa row from listings_tracker.
 *   5. Fetch comparables (same area + bedrooms, fall back to ±1 bed, then
 *      to top-priced-in-area if still <5).
 *   6. Compute core audit + stress-test matrix + exit-scenario table.
 *   7. Generate 5-page Deep Audit PDF.
 *   8. Email via Resend.
 *   9. Insert paid_audits row.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Stripe from "stripe";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";
export const maxDuration = 60;

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Villa {
  id: number;
  slug: string | null;
  villa_name: string | null;
  location: string | null;
  last_price: number | null;
  price_description: string | null;
  bedrooms: number | null;
  projected_roi: number | null;
  est_nightly_rate: number | null;
  est_occupancy: number | null;
  flags: string | null;
  lease_years: number | null;
  url: string | null;
  features: string | null;
  occupancy_confidence: string | null;
  occupancy_sample_size: number | null;
  occupancy_source: string | null;
  rate_source: string | null;
  land_size: string | null;
  building_size: string | null;
  listing_type: string | null;
  beds_baths: string | null;
  price_per_room: number | null;
}

interface AuditNumbers {
  price_usd: number;
  price_desc: string;
  nightly_rate: number;
  occupancy: number;
  bedrooms: number;
  lease_type: string;
  lease_years: number;
  is_leasehold: boolean;
  gross_revenue: number;
  mgmt_fees: number;
  ota_fees: number;
  maintenance: number;
  total_expenses: number;
  lease_cost: number;
  net_revenue: number;
  gross_yield_pct: number;
  net_yield_pct: number;
}

// ------------------------------------------------------------------
// Brand palette — editorial navy / gold, matches the website
// ------------------------------------------------------------------
const COLORS = {
  ink: "#0a0e16",
  inkMuted: "#3d4656",
  inkDim: "#6b7685",
  accent: "#d4943a",
  accentSoft: "#f5e7cf",
  hairline: "#d9d1c2",
  bg: "#fbf6ec",
  bgSoft: "#f3ebd9",
  good: "#1f6f47",
  goodSoft: "#dbeed6",
  warn: "#a86a16",
  warnSoft: "#fbe7c9",
  bad: "#a6342b",
  badSoft: "#f7d7d3",
  white: "#ffffff",
};

// Fallback IDR→USD rate. MUST stay in sync with:
//   - app/_lib/AreaPage.tsx (USD_RATE_FALLBACK)
//   - app/listing/[slug]/page.tsx (FALLBACK_RATES.IDR)
// If this drifts, identical listings display different USD prices across pages.
const USD_RATE_FALLBACK = 16782;

// ------------------------------------------------------------------
// Audit math (mirrors /api/unlock-audit so the two PDFs are consistent)
// ------------------------------------------------------------------
function computeAudit(villa: Villa, usdRate: number): AuditNumbers {
  const priceLocal = villa.last_price || 0;
  const priceDesc = villa.price_description || "";

  let priceUsd = 0;
  const usdMatch = priceDesc.match(/USD\s*([\d,]+)/i);
  if (usdMatch) priceUsd = parseFloat(usdMatch[1].replace(/,/g, ""));
  if (!priceUsd && priceLocal) priceUsd = priceLocal / usdRate;

  const nightlyRate = villa.est_nightly_rate || 0;
  const occupancy = villa.est_occupancy || 0.65;
  const leaseYears = villa.lease_years || 0;
  const bedrooms = villa.bedrooms || 0;
  const featuresLower = (villa.features || "").toLowerCase();
  const isLeasehold =
    featuresLower.includes("leasehold") ||
    (leaseYears > 0 && leaseYears < 99);

  const grossRevenue = nightlyRate * 365 * occupancy;
  let mgmtFees = grossRevenue * 0.15;
  let otaFees = grossRevenue * 0.15;
  let maintenance = grossRevenue * 0.1;
  let totalExpenses = mgmtFees + otaFees + maintenance;

  let leaseCost = 0;
  if (isLeasehold && leaseYears > 0 && priceUsd > 0) {
    leaseCost = priceUsd / leaseYears;
  }
  let netRevenue = grossRevenue - totalExpenses - leaseCost;
  const grossYield = priceUsd > 0 ? (grossRevenue / priceUsd) * 100 : 0;
  let netYield = priceUsd > 0 ? (netRevenue / priceUsd) * 100 : 0;

  // Pipeline-authoritative net yield override. When the scraper/pipeline has
  // stored a projected_roi for the villa, it beats our locally-computed
  // 40%-opex assumption. To keep ALL downstream numbers consistent (Villa
  // Snapshot, cover-page headline, stress-test base case, exit scenarios),
  // we back-derive expenses from the overridden yield — effectively solving
  // for the opex ratio the pipeline implicitly used. Without this, the
  // snapshot and the "Base case (as published)" stress row show different
  // "base" yields, which is a legitimate bug the user caught.
  if (villa.projected_roi !== null && villa.projected_roi !== undefined && priceUsd > 0) {
    netYield = villa.projected_roi;
    netRevenue = (netYield / 100) * priceUsd;
    const derivedOpex = grossRevenue - netRevenue - leaseCost;
    // Preserve mgmt/ota/maintenance weighting (40/40/20 of opex == 15/15/10 of gross).
    if (grossRevenue > 0 && derivedOpex >= 0) {
      totalExpenses = derivedOpex;
      mgmtFees = derivedOpex * 0.375;
      otaFees = derivedOpex * 0.375;
      maintenance = derivedOpex * 0.25;
    }
  }

  return {
    price_usd: priceUsd,
    price_desc: priceDesc,
    nightly_rate: nightlyRate,
    occupancy,
    bedrooms,
    lease_type: isLeasehold ? "Leasehold" : "Freehold",
    lease_years: leaseYears,
    is_leasehold: isLeasehold,
    gross_revenue: grossRevenue,
    mgmt_fees: mgmtFees,
    ota_fees: otaFees,
    maintenance,
    total_expenses: totalExpenses,
    lease_cost: leaseCost,
    net_revenue: netRevenue,
    gross_yield_pct: grossYield,
    net_yield_pct: netYield,
  };
}

function fmtCurrency(n: number): string {
  if (!isFinite(n)) return "$0";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString()}`;
}
function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}
function yieldTier(pct: number): { color: string; bg: string; label: string } {
  if (pct >= 8) return { color: COLORS.good, bg: COLORS.goodSoft, label: "Strong" };
  if (pct >= 5) return { color: COLORS.warn, bg: COLORS.warnSoft, label: "Moderate" };
  if (pct >= 0) return { color: COLORS.bad, bg: COLORS.badSoft, label: "Weak" };
  return { color: COLORS.bad, bg: COLORS.badSoft, label: "Negative" };
}

// ------------------------------------------------------------------
// Comp selection with fallback ladder
// ------------------------------------------------------------------
interface Comp {
  id: number;
  slug: string | null;
  villa_name: string | null;
  location: string | null;
  bedrooms: number | null;
  last_price: number | null;
  price_description: string | null;
  projected_roi: number | null;
  est_nightly_rate: number | null;
  est_occupancy: number | null;
  lease_years: number | null;
}

// Loose typing on purpose: SupabaseClient's generic inference doesn't line up
// between a locally-created client and one passed as a param. We only use
// .from(...).select(...).eq(...) here, which is stable across versions.
// Dedupe by lowercased villa_name so visually-identical titles collapse into
// one row (real-world: scrapers sometimes emit the same generic title for
// different listings in the same development — showing them as separate rows
// makes the report look buggy even though the underlying IDs differ).
function dedupByName(rows: Comp[], targetN: number): Comp[] {
  const seen = new Set<string>();
  const out: Comp[] = [];
  for (const c of rows) {
    const key = (c.villa_name || "").trim().toLowerCase();
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(c);
    if (out.length >= targetN) break;
  }
  return out;
}

async function fetchComps(
  supabase: SupabaseClient,
  villa: Villa,
  targetN = 5
): Promise<{ comps: Comp[]; fallback: string }> {
  const area = villa.location || "";
  const beds = villa.bedrooms || 0;

  // Ladder 1: exact (area, bedrooms), excluding this villa
  // Overfetch (5x) so dedupByName has room to drop identical-titled duplicates.
  let res = await supabase
    .from("listings_tracker")
    .select(
      "id,slug,villa_name,location,bedrooms,last_price,price_description,projected_roi,est_nightly_rate,est_occupancy,lease_years"
    )
    .eq("location", area)
    .eq("bedrooms", beds)
    .neq("id", villa.id)
    .not("last_price", "is", null)
    .not("projected_roi", "is", null)
    .order("projected_roi", { ascending: false })
    .limit(targetN * 5);
  let rows = dedupByName((res.data as Comp[] | null) || [], targetN);
  if (rows.length >= targetN) {
    return { comps: rows, fallback: "exact" };
  }

  // Ladder 2: same area, ±1 bedroom
  const bedsLo = Math.max(1, beds - 1);
  const bedsHi = beds + 1;
  res = await supabase
    .from("listings_tracker")
    .select(
      "id,slug,villa_name,location,bedrooms,last_price,price_description,projected_roi,est_nightly_rate,est_occupancy,lease_years"
    )
    .eq("location", area)
    .gte("bedrooms", bedsLo)
    .lte("bedrooms", bedsHi)
    .neq("id", villa.id)
    .not("last_price", "is", null)
    .not("projected_roi", "is", null)
    .order("projected_roi", { ascending: false })
    .limit(targetN * 5);
  rows = dedupByName((res.data as Comp[] | null) || [], targetN);
  if (rows.length >= targetN) {
    return { comps: rows, fallback: "bed_tolerance" };
  }

  // Ladder 3: any area, exact bedrooms (wider radius)
  res = await supabase
    .from("listings_tracker")
    .select(
      "id,slug,villa_name,location,bedrooms,last_price,price_description,projected_roi,est_nightly_rate,est_occupancy,lease_years"
    )
    .eq("bedrooms", beds)
    .neq("id", villa.id)
    .not("last_price", "is", null)
    .not("projected_roi", "is", null)
    .order("projected_roi", { ascending: false })
    .limit(targetN * 5);
  rows = dedupByName((res.data as Comp[] | null) || [], targetN);
  return {
    comps: rows,
    fallback: rows.length === 0 ? "none" : "any_area",
  };
}

// ------------------------------------------------------------------
// Stress-test scenarios
// ------------------------------------------------------------------
interface Scenario {
  label: string;
  rate_mult: number;
  occ_delta: number;
  opex_mult: number;
  net_yield: number;
  annual_cash: number;
  description: string;
}
function buildScenarios(audit: AuditNumbers): Scenario[] {
  const base = audit.nightly_rate;
  // Derive opex ratio from the audit itself so the "Base case (as published)"
  // scenario lines up with audit.net_yield_pct. Hardcoding 0.4 here used to
  // collide with projected_roi-overridden yields and produce two different
  // "base" numbers in the same PDF.
  const opex_base = audit.gross_revenue > 0
    ? audit.total_expenses / audit.gross_revenue
    : 0.4;
  const specs: Omit<Scenario, "net_yield" | "annual_cash">[] = [
    { label: "Base case (as published)", rate_mult: 1.0, occ_delta: 0, opex_mult: 1.0,
      description: "The headline number from the free audit." },
    { label: "Cyclical downturn (-15% occ)", rate_mult: 1.0, occ_delta: -0.15, opex_mult: 1.0,
      description: "Modeled on Bali's 2015-16 oversupply + 2020 tourism shock blended." },
    { label: "Competitive saturation", rate_mult: 0.88, occ_delta: -0.08, opex_mult: 1.0,
      description: "If Canggu-style inventory growth hits your area: rates compress 12%, occupancy drifts 8pp." },
    { label: "Operating-cost inflation", rate_mult: 1.0, occ_delta: 0, opex_mult: 1.2,
      description: "Indonesia CPI + manager fees + maintenance re-bids at +20% — plausible over a 5yr hold." },
    { label: "Double-shock", rate_mult: 0.88, occ_delta: -0.12, opex_mult: 1.15,
      description: "Saturation + cost inflation stacked. Tests whether the villa is still cash-flow positive." },
    { label: "Bull case (premium repositioning)", rate_mult: 1.15, occ_delta: 0.05, opex_mult: 1.0,
      description: "What you'd need to hit to justify the asking price. Is this realistic?" },
  ];
  return specs.map((s) => {
    const rate = base * s.rate_mult;
    const occ = Math.max(0.15, Math.min(0.95, audit.occupancy + s.occ_delta));
    const gross = rate * 365 * occ;
    const opex = gross * opex_base * s.opex_mult;
    const net = gross - opex - audit.lease_cost;
    const ny = audit.price_usd > 0 ? (net / audit.price_usd) * 100 : 0;
    return { ...s, net_yield: ny, annual_cash: net };
  });
}

// ------------------------------------------------------------------
// Negotiation memo — deterministic, property-specific
// ------------------------------------------------------------------
function buildNegotiationMemo(villa: Villa, audit: AuditNumbers, comps: Comp[]): string[] {
  const lines: string[] = [];
  const ny = audit.net_yield_pct;
  const flags = (villa.flags || "").split(",").map((f) => f.trim()).filter(Boolean);
  const compPrices = comps.map((c) => {
    const d = c.price_description || "";
    const m = d.match(/USD\s*([\d,]+)/i);
    if (m) return parseFloat(m[1].replace(/,/g, ""));
    return (c.last_price || 0) / USD_RATE_FALLBACK;
  }).filter((p) => p > 0);
  const compMed = compPrices.length
    ? compPrices.sort((a, b) => a - b)[Math.floor(compPrices.length / 2)]
    : 0;
  const gapPct = compMed > 0 ? ((audit.price_usd - compMed) / compMed) * 100 : 0;

  // Anchor
  if (compMed > 0 && gapPct > 8) {
    lines.push(
      `Anchor the conversation on comps, not the asking price. This villa is priced ~${gapPct.toFixed(0)}% above the median ${villa.bedrooms || "?"}-bedroom in ${villa.location || "the area"} (median $${Math.round(compMed).toLocaleString()}, n=${compPrices.length}). Open with: "I've looked at ${compPrices.length} comparable listings in the same area and bedroom count. Your price is at the top of the range — what justifies that premium?"`
    );
  } else if (compMed > 0 && gapPct < -8) {
    lines.push(
      `The asking price is ~${Math.abs(gapPct).toFixed(0)}% below the ${villa.location} median for this bedroom tier. That's a signal — either the seller is motivated (offer fast and firm) or there's a defect you haven't found yet (lease, title, structure). Do not close until you've inspected and verified.`
    );
  } else {
    lines.push(
      `Pricing is in line with the ${villa.location} median for this bedroom tier. The negotiation lever is condition, not price — get a professional survey and use defect findings as your discount mechanism.`
    );
  }

  // Walk-away anchor
  // walkAwayPrice is the price at which net yield equals the buyer's minimum
  // acceptable yield. Since yield FALLS as price rises, walkAwayPrice is
  // really a CEILING — the most you should pay. When asking < walkAwayPrice
  // the villa already clears the hurdle, so the "walk-away discipline" flips
  // from "push for a discount to reach yield" to "don't bid above asking,
  // use condition/comps for discount."
  const walkAwayYield = Math.max(5, ny - 1.5);
  const walkAwayPrice =
    audit.net_revenue > 0 && walkAwayYield > 0
      ? audit.net_revenue / (walkAwayYield / 100)
      : audit.price_usd * 0.85;
  if (walkAwayPrice < audit.price_usd) {
    const discountPct = ((audit.price_usd - walkAwayPrice) / audit.price_usd) * 100;
    lines.push(
      `Your walk-away number should be the price that delivers at least a ${walkAwayYield.toFixed(1)}% net yield — approximately ${fmtCurrency(walkAwayPrice)}. That's a ${discountPct.toFixed(0)}% discount from asking. If the seller won't move at least halfway to that, walk. There are ${compPrices.length} comparable listings; you are not obligated to this one.`
    );
  } else {
    lines.push(
      `At asking, this villa already clears your ${walkAwayYield.toFixed(1)}% minimum yield hurdle — it runs at ${fmtPct(ny)}. Yield is not the negotiation lever here. Push on condition and comps instead: commission a survey, and use defect findings plus any gap versus the ${compPrices.length} comparable listings as your discount mechanism. Don't bid above ${fmtCurrency(audit.price_usd)} regardless of how the seller frames demand.`
    );
  }

  // Opening offer
  const openingOffer = audit.price_usd * 0.82;
  lines.push(
    `Recommended opening offer: ${fmtCurrency(openingOffer)} (~18% below asking). This is aggressive but defensible — if the net yield math at the asking price is ${fmtPct(ny)}, you have empirical justification for leaving room. Expect a counter at ~10-12% off. Meet at ~15% off asking if survey comes back clean.`
  );

  // Flag-specific leverage
  if (flags.includes("SHORT_LEASE")) {
    lines.push(
      `**Short-lease leverage:** With <15 years remaining, every year you hold erodes 6-10% of value. Demand a 30-40% discount from a comparable fresh-lease price — not because you're being difficult, but because that's the math.`
    );
  }
  if (flags.includes("OFF_PLAN")) {
    lines.push(
      `**Off-plan leverage:** Do NOT pay more than 30% before Pondok Wisata + PBG + SLF are issued. Insist on a construction guarantee tied to milestone payments. A seller who won't negotiate payment staging is either underfunded or hiding delays.`
    );
  }
  if (flags.includes("BUDGET_VILLA") || flags.includes("EXTREME_BUDGET")) {
    lines.push(
      `**Budget-tier caution:** The "deal" is priced-in. Before negotiating further, verify why this villa is below the 25th percentile. Check land certificate (SHM vs HGB vs Hak Pakai), zoning compatibility, existing debt, and whether it's a nominee structure.`
    );
  }
  if (audit.is_leasehold && audit.lease_years > 0 && audit.lease_years < 25) {
    lines.push(
      `**Lease extension:** Before making the final offer, get the landlord's written quote to extend the lease by 20-25 years. If extension is expensive/impossible, that changes the math — use it as a further discount lever.`
    );
  }

  // Due diligence stop
  lines.push(
    `Do NOT transfer any funds before: (1) a Notaris/PPAT has verified the title chain, (2) a qualified surveyor has inspected the building, (3) Pondok Wisata + PBG + SLF documents are in your possession and validated, (4) a licensed Indonesian lawyer has reviewed the sale agreement. Budget $1,500-3,000 for this. It's cheap insurance.`
  );

  return lines;
}

// ------------------------------------------------------------------
// Exit scenarios (leasehold linear decay)
// ------------------------------------------------------------------
interface ExitRow {
  label: string;
  year: number;
  gross_collected: number;
  ops_paid: number;
  lease_paid: number;
  net_collected: number;
  resale_value: number;
  total_return: number;
  total_return_pct: number;
  annualized_pct: number;
}
function buildExitScenarios(audit: AuditNumbers): ExitRow[] {
  const rows: ExitRow[] = [];
  const holds = audit.is_leasehold && audit.lease_years > 0 ? [3, 5, audit.lease_years] : [3, 5, 10];
  for (const yr of holds) {
    const gross = audit.gross_revenue * yr;
    const ops = audit.total_expenses * yr;
    const leasePaid = audit.lease_cost * yr;
    const net = audit.net_revenue * yr;
    let resale: number;
    if (audit.is_leasehold && audit.lease_years > 0) {
      const remaining = Math.max(0, audit.lease_years - yr);
      resale = audit.price_usd * (remaining / audit.lease_years);
    } else {
      // Freehold — assume flat price in USD (conservative: ignore IDR inflation)
      resale = audit.price_usd;
    }
    const totalReturn = net + resale - audit.price_usd;
    const totalPct = audit.price_usd > 0 ? (totalReturn / audit.price_usd) * 100 : 0;
    const annualized = yr > 0 ? Math.pow(1 + totalPct / 100, 1 / yr) - 1 : 0;
    rows.push({
      label: yr === audit.lease_years ? `Hold to end of lease (Year ${yr})` : `Exit at Year ${yr}`,
      year: yr,
      gross_collected: gross,
      ops_paid: ops,
      lease_paid: leasePaid,
      net_collected: net,
      resale_value: resale,
      total_return: totalReturn,
      total_return_pct: totalPct,
      annualized_pct: annualized * 100,
    });
  }
  return rows;
}

// ------------------------------------------------------------------
// PDF generator — 5 pages
// ------------------------------------------------------------------
function generateDeepPdf(
  villa: Villa,
  audit: AuditNumbers,
  comps: Comp[],
  compFallback: string,
  scenarios: Scenario[],
  memo: string[],
  exits: ExitRow[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 56, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: `BVT Deep Audit — ${villa.villa_name || "Villa"}`,
          Author: "Bali Villa Truth",
        },
      });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Report identifiers shown on the cover page
      const reportId = `BVT-${String(villa.id).padStart(5, "0")}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      const issued = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });

      // PAGE 1 — Cover page (editorial, unnumbered, no watermark)
      renderCoverPage(doc, villa, audit, reportId, issued);

      // PAGE 2 — Summary + stress-test headline
      doc.addPage();
      renderHeader(doc, villa, "Overview");
      renderStressHeadline(doc, audit, scenarios);
      renderKeyStats(doc, villa, audit);
      renderDataProvenance(doc, villa);

      // PAGE 3 — Comparables
      doc.addPage();
      renderHeader(doc, villa, "Area Comparables");
      renderComps(doc, villa, comps, compFallback);

      // PAGE 3 — Stress-test matrix + ops sensitivity
      doc.addPage();
      renderHeader(doc, villa, "Stress Test");
      renderScenarios(doc, scenarios);
      renderOpsSensitivity(doc, audit);

      // PAGE 4 — Negotiation memo
      doc.addPage();
      renderHeader(doc, villa, "Negotiation Memo");
      renderNegotiation(doc, memo);

      // PAGE 5 — Exit scenarios + DD checklist
      doc.addPage();
      renderHeader(doc, villa, "Exit Scenarios & Due Diligence");
      renderExits(doc, exits);
      renderDDChecklist(doc, villa, audit);

      // PAGE 6 — Legal red flags (own page — content-dense enough to warrant it)
      doc.addPage();
      renderHeader(doc, villa, "Legal Red Flags");
      renderLegalRedFlags(doc, villa, audit);

      // PAGE 7 — Closing / contact info
      doc.addPage();
      renderClosing(doc);

      // Dynamic footer + watermark pass: count actual pages, stamp
      // "Page X of Y" and the diagonal wordmark on every content page.
      // The cover (page 0) stays clean — no footer, no watermark.
      const range = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(range.start + i);
        if (i === 0) continue;  // cover page: unadorned by design
        renderWatermark(doc);
        renderFooter(doc, i + 1, totalPages);
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function renderHeader(doc: PDFKit.PDFDocument, villa: Villa, section: string) {
  // Wordmark
  doc.fontSize(13).font("Helvetica-Bold").fillColor(COLORS.ink)
    .text("Bali Villa ", 50, 50, { continued: true })
    .fillColor(COLORS.accent).text("Truth", { continued: false });
  // Section label
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLORS.accent)
    .text(`DEEP AUDIT · ${section.toUpperCase()}`, 50, 52, {
      align: "right", width: 512, characterSpacing: 1.2,
    });

  doc.moveTo(50, 74).lineTo(562, 74).lineWidth(0.5).strokeColor(COLORS.hairline).stroke();

  const name = (villa.villa_name || "Unnamed Villa").trim();
  doc.fontSize(16).font("Helvetica-Bold").fillColor(COLORS.ink)
    .text(name, 50, 86, { width: 512 });
  const loc = villa.location || "Bali, Indonesia";
  const beds = villa.bedrooms ? `· ${villa.bedrooms}-bed` : "";
  doc.fontSize(10).font("Helvetica").fillColor(COLORS.inkDim)
    .text(`${loc} ${beds}`, 50, doc.y + 2);
  doc.y = Math.max(doc.y + 14, 132);
}

function renderStressHeadline(doc: PDFKit.PDFDocument, audit: AuditNumbers, scenarios: Scenario[]) {
  const base = scenarios.find((s) => s.label.startsWith("Base")) || scenarios[0];
  const worst = scenarios.reduce((a, b) => (a.net_yield < b.net_yield ? a : b));
  const best = scenarios.reduce((a, b) => (a.net_yield > b.net_yield ? a : b));

  const y = doc.y;
  const cellW = (512 - 16) / 3;
  const h = 110;
  const boxes = [
    { label: "WORST CASE", value: fmtPct(worst.net_yield), note: worst.label, tier: yieldTier(worst.net_yield) },
    { label: "BASE CASE",  value: fmtPct(base.net_yield),  note: "As published", tier: yieldTier(base.net_yield) },
    { label: "BULL CASE",  value: fmtPct(best.net_yield),  note: best.label, tier: yieldTier(best.net_yield) },
  ];
  boxes.forEach((b, i) => {
    const x = 50 + i * (cellW + 8);
    doc.rect(x, y, cellW, h).fill(b.tier.bg);
    doc.rect(x, y, cellW, h).lineWidth(0.7).strokeColor(b.tier.color).stroke();
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLORS.inkDim)
      .text(b.label, x, y + 12, { width: cellW, align: "center", characterSpacing: 1.2 });
    doc.fontSize(34).font("Helvetica-Bold").fillColor(b.tier.color)
      .text(b.value, x, y + 28, { width: cellW, align: "center" });
    doc.fontSize(8.5).font("Helvetica").fillColor(COLORS.inkMuted)
      .text(b.note, x + 10, y + 76, { width: cellW - 20, align: "center", lineGap: 1 });
  });
  doc.y = y + h + 14;

  doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.inkMuted)
    .text(
      `The free audit shows one number — ${fmtPct(base.net_yield)}. That's a point estimate that assumes nothing changes. The Deep Audit tests the villa against six scenarios. Worst case is ${fmtPct(worst.net_yield)} (${worst.label.toLowerCase()}). Bull case is ${fmtPct(best.net_yield)} (${best.label.toLowerCase()}). The spread tells you how much risk sits in the headline number.`,
      50, doc.y, { width: 512, lineGap: 3 }
    );
  doc.y += 8;
}

function renderKeyStats(doc: PDFKit.PDFDocument, villa: Villa, audit: AuditNumbers) {
  sectionHeader(doc, "Villa Snapshot");
  const leaseLabel = audit.is_leasehold && audit.lease_years
    ? `${audit.lease_type} · ${audit.lease_years}yr remaining`
    : audit.lease_type;

  // Bathrooms — prefer the formatted "2 Bed / 2 Bath" string from scrape,
  // fall back to just bedroom count if beds_baths wasn't captured.
  const bedsBaths = (villa.beds_baths || "").trim();
  const bathsMatch = bedsBaths.match(/(\d+(?:\.\d+)?)\s*Bath/i);
  const bathrooms = bathsMatch ? bathsMatch[1] : null;

  // Size + derived price per m² (uses land size as denominator, matching site).
  const landSize = villa.land_size ? Number(villa.land_size) : 0;
  const buildingSize = villa.building_size ? Number(villa.building_size) : 0;
  const pricePerSqm = landSize > 0 && audit.price_usd > 0
    ? Math.round(audit.price_usd / landSize)
    : 0;

  // Order matters: twoColRows splits via ceil(N/2). First half fills the LEFT
  // column (physical property), second half fills the RIGHT column (financial).
  const rows: [string, string][] = [
    // --- LEFT column: the property itself ---
    ["Property Type", villa.listing_type ? toTitleCase(villa.listing_type) : "—"],
    ["Bedrooms", String(audit.bedrooms || "—")],
    ["Bathrooms", bathrooms || "—"],
    ["Land Size", landSize > 0 ? `${landSize.toLocaleString()} m²` : "—"],
    ["Building Size", buildingSize > 0 ? `${buildingSize.toLocaleString()} m²` : "—"],
    ["Ownership", leaseLabel],
    ["Location", villa.location || "—"],
    // --- RIGHT column: pricing + yield ---
    ["Asking Price", fmtCurrency(audit.price_usd)],
    ["Local Price", audit.price_desc || "—"],
    ["Price / m² (land)", pricePerSqm > 0 ? fmtCurrency(pricePerSqm) : "—"],
    ["Price / Bedroom", villa.price_per_room && villa.price_per_room > 0
      ? fmtCurrency(villa.price_per_room) : "—"],
    ["Est. Nightly Rate", `${fmtCurrency(audit.nightly_rate)}/night`],
    ["Est. Occupancy", fmtPct(audit.occupancy * 100, 0)],
    ["Base Net Yield",   fmtPct(audit.net_yield_pct)],
  ];
  twoColRows(doc, rows);
}

function toTitleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderDataProvenance(doc: PDFKit.PDFDocument, villa: Villa) {
  sectionHeader(doc, "Data Provenance");
  const rateSource = villa.rate_source || "bvt_auditor";
  const occSource = villa.occupancy_source || "flat 65% assumption";
  const occN = villa.occupancy_sample_size || 0;
  const occConf = villa.occupancy_confidence || "—";
  const rows: string[][] = [
    ["Signal", "Value", "Confidence"],
    ["Nightly rate", rateSource.replace(/_/g, " "), "BVT editorial estimate. We do not have a licensing agreement with AirDNA or Booking — treat as a considered guess, not a measurement."],
    ["Occupancy", occSource, occN > 0 ? `${String(occConf).toUpperCase()} (n=${occN} reviews)` : "Flat assumption"],
    ["Asking price", villa.price_description || "—", "Scraped from source listing; verify in-person."],
    ["Lease years", villa.lease_years ? String(villa.lease_years) : "N/A", "From listing description; verify via Notaris."],
  ];
  dataTable(doc, rows, [100, 140, 272]);
}

function renderComps(doc: PDFKit.PDFDocument, villa: Villa, comps: Comp[], fallback: string) {
  const fallbackText: Record<string, string> = {
    exact: `Exact match — same ${villa.location}, ${villa.bedrooms}-bed.`,
    bed_tolerance: `Not enough exact matches — expanded to ±1 bedroom in ${villa.location}.`,
    any_area: `Not enough matches in ${villa.location} — expanded island-wide for ${villa.bedrooms}-bed only.`,
    none: `No comparable listings found in our database. The comp-based conclusions below may be unreliable.`,
  };

  // Defensive: ensure no comp matches the subject villa's ID (paranoia check)
  const filteredComps = comps.filter(c => c.id !== villa.id);

  sectionHeader(doc, `Top ${filteredComps.length} Comparable Listings`);
  doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.inkMuted)
    .text(fallbackText[fallback] || "", 50, doc.y, { width: 512, lineGap: 2 });
  doc.y += 6;

  if (filteredComps.length === 0) {
    doc.fontSize(9.5).font("Helvetica-Oblique").fillColor(COLORS.inkDim)
      .text("No comparables available. Treat this property's yield in isolation.", 50, doc.y, { width: 512 });
    doc.y += 12;
    return;
  }

  const headerRow = ["Villa", "Area", "Beds", "Price", "Yield", "Lease"];
  const rows: string[][] = [headerRow];
  for (const c of filteredComps) {
    const nm = (c.villa_name || "—").slice(0, 100);
    const price = (() => {
      const d = c.price_description || "";
      const m = d.match(/USD\s*([\d,]+)/i);
      if (m) return `$${parseFloat(m[1].replace(/,/g, "")).toLocaleString()}`;
      return c.last_price ? fmtCurrency(c.last_price / USD_RATE_FALLBACK) : "—";
    })();
    const lease = c.lease_years ? `${c.lease_years}yr` : "Free";
    rows.push([
      nm,
      (c.location || "—").slice(0, 18),
      String(c.bedrooms || "—"),
      price,
      c.projected_roi !== null && c.projected_roi !== undefined ? `${Number(c.projected_roi).toFixed(1)}%` : "—",
      lease,
    ]);
  }
  dataTable(doc, rows, [225, 85, 42, 70, 45, 45]);
  doc.y += 10;

  // Median line
  const prices = filteredComps.map((c) => {
    const d = c.price_description || "";
    const m = d.match(/USD\s*([\d,]+)/i);
    if (m) return parseFloat(m[1].replace(/,/g, ""));
    return (c.last_price || 0) / USD_RATE_FALLBACK;
  }).filter((p) => p > 0).sort((a, b) => a - b);
  const yields = filteredComps.map((c) => c.projected_roi).filter((v): v is number => v !== null && v !== undefined).sort((a, b) => a - b);
  if (prices.length && yields.length) {
    const priceMed = prices[Math.floor(prices.length / 2)];
    const yieldMed = yields[Math.floor(yields.length / 2)];
    doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.accent)
      .text(
        `Peer-group median: $${Math.round(priceMed).toLocaleString()} · ${yieldMed.toFixed(1)}% net yield (n=${filteredComps.length})`,
        50, doc.y, { width: 512 }
      );
    doc.y += 16;
    doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.inkMuted)
      .text(
        "Use this line in your negotiation. If your target villa is priced materially above the peer-group median without a defensible quality premium (oceanfront, fresh lease, recent renovation), that's unnegotiated margin — which belongs to you, not the seller.",
        50, doc.y, { width: 512, lineGap: 2 }
      );
    doc.y += 6;
    doc.fontSize(8).font("Helvetica-Oblique").fillColor(COLORS.inkDim)
      .text(
        "Note: Comps at identical prices may show different yields due to lease-decay adjustments — shorter remaining lease terms result in lower effective yields.",
        50, doc.y, { width: 512, lineGap: 1.5 }
      );
  }
}

function renderScenarios(doc: PDFKit.PDFDocument, scenarios: Scenario[]) {
  sectionHeader(doc, "Six-Scenario Stress Test");
  const rows: string[][] = [["Scenario", "Rate", "Occ", "Opex", "Net yield", "Cashflow"]];
  for (const s of scenarios) {
    rows.push([
      s.label,
      `${Math.round(s.rate_mult * 100)}%`,
      s.occ_delta >= 0 ? `+${(s.occ_delta * 100).toFixed(0)}pp` : `${(s.occ_delta * 100).toFixed(0)}pp`,
      `${Math.round(s.opex_mult * 100)}%`,
      fmtPct(s.net_yield),
      fmtCurrency(s.annual_cash),
    ]);
  }
  dataTable(doc, rows, [228, 50, 50, 50, 62, 72]);
  doc.y += 8;

  doc.fontSize(8.5).font("Helvetica-Oblique").fillColor(COLORS.inkDim)
    .text("Rate = % of base nightly rate. Occ = delta from base occupancy. Opex = operating cost multiplier.", 50, doc.y, { width: 512 });
  doc.y += 16;

  // Narrative
  // Branch ordering matters: check absolute worst-case yield BEFORE spread,
  // because a tight spread from an already-low base is still fragile, not robust.
  const worst = scenarios.reduce((a, b) => (a.net_yield < b.net_yield ? a : b));
  const base = scenarios.find((s) => s.label.startsWith("Base")) || scenarios[0];
  const bull = scenarios.find((s) => s.label.startsWith("Bull"));
  const spread = base.net_yield - worst.net_yield;
  let interpretation: string;
  if (worst.net_yield < 0) {
    interpretation = `Under a double-shock (${worst.label.toLowerCase()}) this villa goes cash-flow negative (${fmtPct(worst.net_yield)}). You would need external income to carry it. Budget the risk.`;
  } else if (worst.net_yield < 3) {
    interpretation = `Under a double-shock (${worst.label.toLowerCase()}) net yield collapses to ${fmtPct(worst.net_yield)} — below the ~3% risk-free alternative. The villa stays positive on paper but loses its investment rationale in that scenario. If you think simultaneous rate, occupancy, and cost pressure is plausible, you need a bigger discount at purchase to compensate.`;
  } else if (spread > 4) {
    interpretation = `The yield range is wide (${fmtPct(worst.net_yield)}-${fmtPct(bull?.net_yield || 0)}). Performance depends heavily on the rate/occupancy assumptions holding. Model it against your own risk tolerance.`;
  } else {
    interpretation = `The yield range is tight across scenarios and the worst case (${fmtPct(worst.net_yield)}) stays above the risk-free floor. This villa is relatively robust to the shocks modeled here.`;
  }
  doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.inkMuted)
    .text(interpretation, 50, doc.y, { width: 512, lineGap: 3 });
  doc.y += 10;
}

function renderOpsSensitivity(doc: PDFKit.PDFDocument, audit: AuditNumbers) {
  sectionHeader(doc, "Operating-Cost Sensitivity");
  doc.fontSize(9).font("Helvetica").fillColor(COLORS.inkMuted)
    .text("How does net yield change if specific line items come in higher than our 15/15/10% assumptions? (Real-world Bali villa OpEx often runs 45-55% of gross once you include repairs, staff, and pool/garden.)",
          50, doc.y, { width: 512, lineGap: 2 });
  doc.y += 8;

  const rows: string[][] = [["Total OpEx % of gross", "Net yield", "Vs base"]];
  const bases = [0.35, 0.40, 0.45, 0.50, 0.55, 0.60];
  const baseYield = audit.net_yield_pct;
  for (const pct of bases) {
    const gross = audit.gross_revenue;
    const net = gross * (1 - pct) - audit.lease_cost;
    const y = audit.price_usd > 0 ? (net / audit.price_usd) * 100 : 0;
    const delta = y - baseYield;
    rows.push([
      `${(pct * 100).toFixed(0)}%`,
      fmtPct(y),
      delta >= 0 ? `+${fmtPct(delta)}` : fmtPct(delta),
    ]);
  }
  dataTable(doc, rows, [200, 150, 162]);
}

function renderNegotiation(doc: PDFKit.PDFDocument, memo: string[]) {
  sectionHeader(doc, "Your Negotiation Memo");
  doc.fontSize(9).font("Helvetica-Oblique").fillColor(COLORS.inkDim)
    .text("Walk into the meeting with this printed out. Read it the night before. Don't paraphrase — the specific numbers matter.",
          50, doc.y, { width: 512, lineGap: 2 });
  doc.y += 10;

  memo.forEach((line, i) => {
    // Bold-marker support: **xxx** → bold header portion followed by rest.
    const m = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.accent)
      .text(`${i + 1}.  `, 50, doc.y, { continued: true });
    if (m) {
      doc.fontSize(9.5).font("Helvetica-Bold").fillColor(COLORS.ink)
        .text(m[1] + ": ", { continued: true });
      doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.inkMuted)
        .text(m[2], { width: 500, lineGap: 2 });
    } else {
      doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.inkMuted)
        .text(line, { width: 500, lineGap: 2 });
    }
    doc.y += 5;
  });
}

function renderExits(doc: PDFKit.PDFDocument, exits: ExitRow[]) {
  sectionHeader(doc, "Exit Scenarios");
  const rows: string[][] = [["Hold period", "Cash collected", "Resale est.", "Total return", "Annual %"]];
  for (const e of exits) {
    rows.push([
      e.label,
      fmtCurrency(e.net_collected),
      fmtCurrency(e.resale_value),
      fmtCurrency(e.total_return),
      `${e.annualized_pct.toFixed(1)}%`,
    ]);
  }
  dataTable(doc, rows, [180, 100, 90, 90, 52]);
  doc.y += 6;
  doc.fontSize(8).font("Helvetica-Oblique").fillColor(COLORS.inkDim)
    .text("Net profit = (Cash collected + Resale estimate) - Purchase price.",
          50, doc.y, { width: 512, lineGap: 1 });
  doc.y += 8;
  doc.fontSize(8.5).font("Helvetica-Oblique").fillColor(COLORS.inkDim)
    .text("Leasehold resale estimated via linear lease-amortization (remaining years / total years × purchase price). Real resale depends on buyer demand at exit, which is the weakest point in Bali's market — short-lease resale can be illiquid. Freehold resale assumes flat USD price (a conservative floor).",
          50, doc.y, { width: 512, lineGap: 2 });
  doc.y += 12;
}

function renderDDChecklist(doc: PDFKit.PDFDocument, villa: Villa, audit: AuditNumbers) {
  sectionHeader(doc, "Deep Due-Diligence Checklist");
  const items = [
    "Title certificate in Indonesian (SHM / HGB / Hak Pakai) — verified at BPN (Badan Pertanahan Nasional).",
    "Chain of title — most recent three transfers traceable through Notaris/PPAT records.",
    "IMB (old) or PBG (new post-2021) building permit — confirm exists and matches current structure footprint.",
    "SLF (Sertifikat Laik Fungsi) — confirms the building meets occupancy code (critical for villas built 2021+).",
    "Pondok Wisata or TDUP license for short-term rental — without this, Airbnb is technically illegal.",
    "Zoning compliance — the land must be zoned for tourism/accommodation, not agriculture.",
    "No active disputes, liens, or caveats against the title — ask the Notaris to run a full search.",
    "Property tax (PBB) paid current year and prior three years — arrears are attached to the land.",
    "If leasehold: original lease agreement notarized, endorsed by landlord and landlord's spouse if applicable.",
    "If leasehold: landlord's underlying ownership of the land (the lessor must actually own it).",
    "Electricity (PLN) meter in seller's name and paid current; no irregular consumption spikes.",
    "Water source confirmed — borewell depth, licensing (SIPA), and water quality test results.",
    "Septic / black-water handling — distance from borewell per Indonesian code (>=10m).",
    "Structural survey by an independent engineer — foundation, walls, roof, and tropical-climate damage.",
    "Pool: liner/tile age, pump condition, salt/chlorine system, last resurfacing date.",
    "AC units — make, age, and servicing history (tropical AC lasts 5-7 years).",
    "Waste management and drainage during monsoon — inspect during rainy season if possible.",
    villa.features?.toLowerCase().includes("beach") ? "Beach-access setback — compliance with 30m coastal buffer under PP 64/2010." : "Road access — registered public road (not private easement).",
    "Existing rental contracts with any current manager — termination clause, handover terms, deposit held.",
    "Owner's books — 24 months of booking-by-booking revenue, not just a summary.",
    "Utility cost history — electricity, pool, garden, staff — full 12 months.",
    "Staff situation — who's employed, contract terms, severance obligations.",
    "Insurance policies currently in force — public liability, fire, earthquake.",
    "Neighbor disputes — walk the boundary with a local guide, ask direct neighbors.",
    "Banjar (village council) standing — is the villa in good standing with the community? (Ask the kepala banjar directly.)",
  ];
  items.forEach((item, i) => {
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLORS.accent)
      .text(`[ ]  `, 50, doc.y, { continued: true });
    doc.font("Helvetica").fillColor(COLORS.inkMuted)
      .text(item, { width: 500, lineGap: 1.5 });
    doc.y += 2;
  });
  doc.y += 6;
}

function renderLegalRedFlags(doc: PDFKit.PDFDocument, villa: Villa, audit: AuditNumbers) {
  sectionHeader(doc, "Legal Red Flags for Foreign Buyers");
  const flags: string[] = [
    "Foreigners cannot own Hak Milik (SHM) freehold land. If someone offers you SHM in a foreigner's name, it is either (a) illegal via a nominee arrangement, or (b) fraud. Both expose you to total loss.",
    "Legitimate foreign-buyer structures: (1) Leasehold in personal name, (2) Hak Pakai as a KITAS holder, (3) PT PMA owning Hak Guna Bangunan. Anything else requires extreme scrutiny.",
    "Nominee arrangements (where an Indonesian national 'holds' the title for you) are void under Article 21 of the Agrarian Law. Indonesian courts have ruled them unenforceable. You have no legal recourse.",
    "Construction financing: Indonesia has no reliable escrow system for real estate. If you're buying off-plan, milestone payments into the developer's account are effectively unsecured loans. Insist on staged payments tied to inspection sign-offs, and a third party payment holder where possible.",
  ];
  if (audit.is_leasehold && audit.lease_years > 0 && audit.lease_years < 20) {
    flags.push(
      `**This villa has only ${audit.lease_years} years of lease remaining.** Foreign residents with KITAS can convert leasehold to Hak Pakai in some circumstances — worth exploring with a real-estate lawyer before closing, as it can extend usability.`
    );
  }
  flags.forEach((text) => {
    const m = text.match(/^\*\*(.+?)\*\*\s*(.*)$/);
    doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.bad)
      .text("[!]  ", 50, doc.y, { continued: true });
    if (m) {
      doc.font("Helvetica-Bold").fillColor(COLORS.ink).text(m[1] + " ", { continued: true });
      doc.font("Helvetica").fillColor(COLORS.inkMuted).text(m[2], { width: 500, lineGap: 2 });
    } else {
      doc.font("Helvetica").fillColor(COLORS.inkMuted).text(text, { width: 500, lineGap: 2 });
    }
    doc.y += 3;
  });
}

function renderClosing(doc: PDFKit.PDFDocument) {
  doc.y = 140;
  doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.accent)
    .text("Questions?", 50, doc.y);
  doc.y += 20;
  doc.fontSize(11).font("Helvetica").fillColor(COLORS.inkMuted)
    .text("Email us anytime:", 50, doc.y);
  doc.y += 8;
  doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.ink)
    .text("hello@balivillatruth.com", 50, doc.y);
  doc.y += 28;

  doc.fontSize(11).font("Helvetica").fillColor(COLORS.inkMuted)
    .text("30-Day Refund Policy:", 50, doc.y);
  doc.y += 8;
  doc.fontSize(10).font("Helvetica").fillColor(COLORS.inkMuted)
    .text("Email us within 30 days for a full refund, no questions asked.", 50, doc.y, { width: 512, lineGap: 2 });
  doc.y += 16;

  doc.fontSize(10).font("Helvetica").fillColor(COLORS.inkMuted)
    .text("Want a deeper bespoke audit with a call? Reply to your audit email and let's set something up.", 50, doc.y, { width: 512, lineGap: 2 });
  doc.y += 32;

  doc.fontSize(9).font("Helvetica-Oblique").fillColor(COLORS.inkDim)
    .text("Thank you for choosing Bali Villa Truth.", 50, doc.y, { width: 512 });
}

function renderFinalDisclaimer(doc: PDFKit.PDFDocument) {
  const y = doc.y + 4;
  const h = 56;
  doc.rect(50, y, 512, h).fill(COLORS.warnSoft);
  doc.rect(50, y, 512, h).lineWidth(0.5).strokeColor(COLORS.warn).stroke();
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLORS.ink)
    .text("This is not financial or legal advice.  ", 62, y + 10, { continued: true });
  doc.font("Helvetica").fillColor(COLORS.inkMuted)
    .text("Bali Villa Truth publishes research derived from public listings and market modeling. We do not have access to this villa's owner books, title documents, or regulatory filings. Every number above is an estimate — verify with a licensed Notaris/PPAT, independent surveyor, and Indonesian real-estate lawyer before transferring any funds.",
          { width: 488, lineGap: 2 });
}

function renderFooter(doc: PDFKit.PDFDocument, pageNum: number, total: number) {
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  const y = 755;
  doc.fontSize(7).font("Helvetica").fillColor(COLORS.inkDim)
    .text(
      "BVT Deep Audit · Not financial or legal advice · Verify independently before investing · balivillatruth.com",
      50, y, { width: 512, align: "center", lineBreak: false }
    );
  doc.fontSize(7).fillColor(COLORS.inkDim)
    .text(`Page ${pageNum} of ${total}`, 50, y, { width: 512, align: "right", lineBreak: false });
  doc.page.margins.bottom = savedBottom;
}

// Subtle diagonal wordmark across the page. Drawn with low fill opacity so
// it reads as a paper/document watermark without fighting the content.
// Stamped in the buffered-pages pass, so cover page can opt out.
function renderWatermark(doc: PDFKit.PDFDocument) {
  doc.save();
  const cx = doc.page.width / 2;
  const cy = doc.page.height / 2;
  doc.rotate(-28, { origin: [cx, cy] });
  doc.fillOpacity(0.04);
  doc.fontSize(78).font("Helvetica-Bold").fillColor(COLORS.ink)
    .text("BALI VILLA TRUTH",
      0, cy - 48,
      { width: doc.page.width, align: "center", lineBreak: false, characterSpacing: 4 });
  doc.fillOpacity(1);
  doc.restore();
}

// Editorial cover page — wordmark band, property title, meta grid, disclaimer.
// No header/footer/watermark; signals "this is a report, not a dashboard."
function renderCoverPage(doc: PDFKit.PDFDocument, villa: Villa, audit: AuditNumbers, reportId: string, issued: string) {
  const W = doc.page.width;   // 612
  const H = doc.page.height;  // 792

  // --- Top wordmark band (full-bleed, thin) ---
  doc.rect(0, 0, W, 6).fill(COLORS.accent);
  doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.ink)
    .text("Bali Villa ", 50, 32, { continued: true })
    .fillColor(COLORS.accent).text("Truth", { continued: false });
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLORS.inkDim)
    .text("PROPERTY INVESTMENT AUDIT", 50, 34, {
      align: "right", width: 512, characterSpacing: 1.5,
    });
  doc.moveTo(50, 60).lineTo(562, 60).lineWidth(0.5).strokeColor(COLORS.hairline).stroke();

  // --- Centered title block ---
  const titleY = 220;
  doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.accent)
    .text("DEEP AUDIT REPORT", 50, titleY, {
      width: 512, align: "center", characterSpacing: 3,
    });

  // Property title — large, editorial
  const name = (villa.villa_name || "Unnamed Villa").trim();
  doc.fontSize(28).font("Helvetica-Bold").fillColor(COLORS.ink)
    .text(name, 50, titleY + 26, {
      width: 512, align: "center", lineGap: 4,
    });

  // Location subtitle
  const loc = villa.location || "Bali, Indonesia";
  const beds = villa.bedrooms ? ` · ${villa.bedrooms}-bedroom` : "";
  const leaseTag = audit.is_leasehold && audit.lease_years
    ? ` · ${audit.lease_type}, ${audit.lease_years}yr`
    : audit.lease_type ? ` · ${audit.lease_type}` : "";
  doc.fontSize(12).font("Helvetica").fillColor(COLORS.inkMuted)
    .text(`${loc}${beds}${leaseTag}`, 50, doc.y + 6, {
      width: 512, align: "center",
    });

  // Gold hairline separator
  const sepY = doc.y + 24;
  doc.moveTo(230, sepY).lineTo(382, sepY).lineWidth(1).strokeColor(COLORS.accent).stroke();

  // --- Three-column meta strip ---
  const metaY = sepY + 32;
  const colW = 512 / 3;
  const drawMeta = (label: string, value: string, col: number) => {
    const x = 50 + col * colW;
    doc.fontSize(7.5).font("Helvetica-Bold").fillColor(COLORS.inkDim)
      .text(label.toUpperCase(), x, metaY, { width: colW, align: "center", characterSpacing: 1.5 });
    doc.fontSize(11).font("Helvetica").fillColor(COLORS.ink)
      .text(value, x, metaY + 14, { width: colW, align: "center" });
  };
  drawMeta("Report ID", reportId, 0);
  drawMeta("Issued", issued, 1);
  drawMeta("Prepared by", "BVT Audit Desk", 2);

  // --- Headline metric card — centered, mid-page ---
  const cardY = metaY + 70;
  const cardH = 90;
  const cardW = 280;
  const cardX = (W - cardW) / 2;
  doc.rect(cardX, cardY, cardW, cardH).fill(COLORS.bgSoft);
  doc.rect(cardX, cardY, cardW, cardH).lineWidth(0.5).strokeColor(COLORS.hairline).stroke();
  doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.inkDim)
    .text("STRESS-TESTED NET YIELD", cardX, cardY + 14,
      { width: cardW, align: "center", characterSpacing: 2 });
  const tier = yieldTier(audit.net_yield_pct);
  doc.fontSize(36).font("Helvetica-Bold").fillColor(tier.color)
    .text(fmtPct(audit.net_yield_pct), cardX, cardY + 30,
      { width: cardW, align: "center" });
  doc.fontSize(9).font("Helvetica").fillColor(COLORS.inkMuted)
    .text(`Base case · ${tier.label.toLowerCase()}`, cardX, cardY + 72,
      { width: cardW, align: "center" });

  // --- Bottom disclaimer + URL ---
  // NB: all fixed-position text on this page must stay at y <= page.height -
  // page.margins.bottom (732 at Letter with bottom=60). Writing past the
  // margin triggers pdfkit auto-pagination and injects a blank page 2
  // between cover and Overview. `lineBreak: false` is extra insurance — it
  // prevents pdfkit from issuing a newline that would push y past the
  // margin and kick off a fresh page mid-stream.
  const bottomY = H - 150;  // ~642; gives the 4-line disclaimer (~50pt) room
  doc.fontSize(8).font("Helvetica-Oblique").fillColor(COLORS.inkMuted)
    .text(
      "This report synthesizes public listing data, local market comparables, and conservative stress-test modeling. It is not financial, legal, or tax advice. Verify every number independently with a licensed Notaris/PPAT, qualified surveyor, and Indonesian real-estate lawyer before transferring funds.",
      80, bottomY, { width: 452, align: "center", lineGap: 3 });

  doc.moveTo(260, H - 92).lineTo(352, H - 92).lineWidth(0.5).strokeColor(COLORS.accent).stroke();
  doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.ink)
    .text("balivillatruth.com", 50, H - 82,
      { width: 512, align: "center", characterSpacing: 1, lineBreak: false });
}

// ------------------------------------------------------------------
// Table / section helpers
// ------------------------------------------------------------------
function sectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.y += 4;
  doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.accent)
    .text(title.toUpperCase(), 50, doc.y, { width: 512, characterSpacing: 1 });
  doc.moveTo(50, doc.y + 2).lineTo(562, doc.y + 2).lineWidth(0.5).strokeColor(COLORS.hairline).stroke();
  doc.y += 6;
}

// Side-by-side 2-column label→value table. Halves the vertical footprint so
// a 14-row Villa Snapshot fits on page 1 with room for the next section.
// Bottom margin for page-break: 70pt keeps content above the footer stamp.
function twoColRows(doc: PDFKit.PDFDocument, rows: [string, string][]) {
  const rowH = 20;
  const colW = 256;           // 512 total content width / 2
  const labelW = 118;         // label portion of each column
  const valuePad = 8;         // gap between label and value
  const pageBottom = doc.page.height - 70;

  const half = Math.ceil(rows.length / 2);
  const left = rows.slice(0, half);
  const right = rows.slice(half);
  const maxRows = Math.max(left.length, right.length);

  let y = doc.y;
  for (let i = 0; i < maxRows; i++) {
    if (y + rowH > pageBottom) {
      doc.addPage();
      y = doc.y;
    }
    // Zebra stripe — span both columns as one band so it reads as a single table.
    if (i % 2 === 0) doc.rect(50, y, 512, rowH).fill(COLORS.bgSoft);

    // Left column
    if (left[i]) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.inkDim)
        .text(left[i][0], 60, y + 7, { width: labelW });
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.ink)
        .text(left[i][1], 60 + labelW + valuePad, y + 7,
          { width: colW - labelW - valuePad - 20 });
    }
    // Right column (starts at x = 50 + 256 = 306)
    if (right[i]) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.inkDim)
        .text(right[i][0], 60 + colW, y + 7, { width: labelW });
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.ink)
        .text(right[i][1], 60 + colW + labelW + valuePad, y + 7,
          { width: colW - labelW - valuePad - 20 });
    }
    y += rowH;
  }
  doc.y = y + 10;
}

function dataTable(doc: PDFKit.PDFDocument, rows: string[][], widths: number[]) {
  let y = doc.y;
  const pad = 6;
  const minRowH = 20;
  // Bottom margin for page-break: 70pt keeps content above the footer stamp.
  const pageBottom = doc.page.height - 70;
  rows.forEach((row, i) => {
    const isHeader = i === 0;
    const font = isHeader ? "Helvetica-Bold" : "Helvetica";
    const color = isHeader ? COLORS.ink : COLORS.inkMuted;

    // Measure the tallest wrapped cell so no row's text overlaps the next one.
    doc.fontSize(8.5).font(font);
    let maxH = 0;
    row.forEach((cell, j) => {
      const align = j === 0 ? "left" : "right";
      const h = doc.heightOfString(cell || "", { width: widths[j] - 16, align });
      if (h > maxH) maxH = h;
    });
    const rowH = Math.max(minRowH, Math.ceil(maxH) + pad * 2);

    // Page-break guard: if this row won't fit, start a new page BEFORE
    // drawing any of its cells. Otherwise pdfkit's per-text() auto-paginate
    // kicks in per-cell and blows each cell onto its own blank page.
    if (y + rowH > pageBottom) {
      doc.addPage();
      y = doc.y;
    }

    if (isHeader) doc.rect(50, y, 512, rowH).fill(COLORS.bgSoft);

    let x = 50;
    row.forEach((cell, j) => {
      const align = j === 0 ? "left" : "right";
      doc.fontSize(8.5).font(font).fillColor(color)
        .text(cell || "", x + 8, y + pad, { width: widths[j] - 16, align });
      x += widths[j];
    });
    doc.lineWidth(0.3).strokeColor(COLORS.hairline);
    doc.moveTo(50, y + rowH).lineTo(562, y + rowH).stroke();
    y += rowH;
  });
  doc.y = y;
}

// ------------------------------------------------------------------
// Email
// ------------------------------------------------------------------
function buildEmailHtml(villa: Villa, audit: AuditNumbers): string {
  const name = villa.villa_name || "this villa";
  const tier = yieldTier(audit.net_yield_pct);
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#fbf6ec;padding:24px;color:#0a0e16;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #d9d1c2;">
<div style="padding:24px 28px;border-bottom:1px solid #d9d1c2;"><div style="font-size:18px;font-weight:bold;">Bali Villa <span style="color:#d4943a;">Truth</span></div><div style="font-size:10px;color:#6b7685;letter-spacing:1.5px;margin-top:4px;">DEEP AUDIT · PAID TIER</div></div>
<div style="padding:28px;">
<h1 style="font-size:20px;margin:0 0 12px;line-height:1.3;">Your Deep Audit for ${escapeHtml(name)}</h1>
<p style="color:#3d4656;line-height:1.6;margin:0 0 20px;">Attached: a 5-page PDF — stress-test matrix, area comparables, negotiation memo, exit scenarios, and a full due-diligence checklist.</p>
<div style="background:${tier.bg};border:1px solid ${tier.color};border-radius:8px;padding:18px;text-align:center;margin:20px 0;">
<div style="font-size:10px;font-weight:bold;color:#6b7685;letter-spacing:1px;">BASE-CASE NET YIELD</div>
<div style="font-size:32px;font-weight:bold;color:${tier.color};margin:6px 0;">${fmtPct(audit.net_yield_pct)}</div>
<div style="font-size:11px;color:${tier.color};font-weight:bold;">${tier.label} · Full stress-test inside</div></div>
<p style="color:#3d4656;line-height:1.6;margin:16px 0;">Two requests:</p>
<ol style="color:#3d4656;line-height:1.7;padding-left:20px;">
<li><strong>Print it.</strong> Take it to the viewing. Read the negotiation memo the night before.</li>
<li><strong>Don't wire anything yet.</strong> Work through the due-diligence checklist in section 5 first. The $49 you paid for this is cheap insurance — the Notaris/lawyer/surveyor fees ($1.5-3k) are the real insurance.</li>
</ol>
<div style="background:#fbe7c9;border:1px solid #a86a16;border-radius:6px;padding:14px;font-size:13px;color:#78350f;margin:20px 0;"><strong>Not financial or legal advice.</strong> Verify with a Notaris, independent surveyor, and Indonesian lawyer before transferring funds.</div>
<p style="color:#6b7685;font-size:12px;line-height:1.5;margin-top:24px;">Questions? Just reply to this email — we read every message.</p>
</div></div></body></html>`;
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ------------------------------------------------------------------
// Route handler — supports GET (success page) and POST (retry / admin)
// ------------------------------------------------------------------
async function handle(session_id: string) {
  if (!session_id || !/^cs_[a-zA-Z0-9_]+$/.test(session_id)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  // Defensive trim — Vercel's env editor sometimes records trailing
  // newlines from pasted values, which break downstream API calls.
  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  const resendKey = (process.env.RESEND_API_KEY || "").trim();
  const fromEmail = (
    process.env.RESEND_FROM_EMAIL || "audits@balivillatruth.com"
  ).trim();
  const fromName = (
    process.env.RESEND_FROM_NAME || "Bali Villa Truth"
  ).trim();

  if (!stripeKey || !supabaseUrl || !supabaseKey || !resendKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Verify Stripe session
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    return NextResponse.json({ error: "Could not find checkout session" }, { status: 404 });
  }
  if (session.status !== "complete" || session.payment_status !== "paid") {
    return NextResponse.json(
      {
        error: "Payment not complete",
        status: session.status,
        payment_status: session.payment_status,
      },
      { status: 402 }
    );
  }

  const meta = session.metadata || {};
  const villa_id = Number(meta.villa_id);
  const email = String(meta.email || session.customer_details?.email || "").trim();
  if (!villa_id || !email) {
    return NextResponse.json({ error: "Session metadata missing villa_id or email" }, { status: 400 });
  }

  // 2. Idempotency — if we've already sent for this session, skip.
  const existing = await supabase
    .from("paid_audits")
    .select("id, sent_at")
    .eq("stripe_session_id", session_id)
    .maybeSingle();
  if (existing.data?.sent_at) {
    return NextResponse.json({
      status: "already_sent",
      message: "This audit has already been emailed.",
      email,
    });
  }

  // 3. Fetch villa
  const { data: villa, error: villaErr } = await supabase
    .from("listings_tracker")
    .select("*")
    .eq("id", villa_id)
    .limit(1)
    .single();
  if (villaErr || !villa) {
    return NextResponse.json({ error: "Villa not found" }, { status: 404 });
  }

  // 4. Fetch comps + run computations
  const { comps, fallback } = await fetchComps(supabase, villa as Villa, 5);
  const audit = computeAudit(villa as Villa, USD_RATE_FALLBACK);
  const scenarios = buildScenarios(audit);
  const memo = buildNegotiationMemo(villa as Villa, audit, comps);
  const exits = buildExitScenarios(audit);

  // 5. Generate PDF
  const pdfBuffer = await generateDeepPdf(villa as Villa, audit, comps, fallback, scenarios, memo, exits);

  // 6. Send email
  const resend = new Resend(resendKey);
  const safeName = ((villa.villa_name || "villa").slice(0, 40)).replace(/[^a-zA-Z0-9-_]/g, "_");
  const { error: sendErr } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [email],
    subject: `Your BVT Deep Audit — ${(villa.villa_name || "villa").slice(0, 60)}`,
    html: buildEmailHtml(villa as Villa, audit),
    attachments: [
      {
        filename: `BVT-DeepAudit-${safeName}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
  if (sendErr) {
    console.error("Deep-audit send error:", sendErr);
    return NextResponse.json({ error: "Failed to send audit email" }, { status: 500 });
  }

  // 7. Record in paid_audits
  await supabase.from("paid_audits").upsert(
    {
      stripe_session_id: session_id,
      email,
      villa_id,
      villa_name: villa.villa_name,
      amount_cents: session.amount_total ?? null,
      currency: session.currency ?? null,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "stripe_session_id" }
  );

  return NextResponse.json({
    status: "sent",
    message: "Deep audit emailed. Check your inbox.",
    email,
    villa_name: villa.villa_name,
  });
}

// ==================================================================
// TEST HARNESS — synthetic villa profiles for narrative QA
// ------------------------------------------------------------------
// These profiles span the parameter space that drives the prose
// branches (yield tier × price vs comps × flag set × walkAway vs
// asking). Running all 6 before promoting the $49 tier surfaces
// any remaining math-vs-narrative contradictions.
//
// Usage: GET /api/generate-deep-audit?test=<1-6>&key=<DEEP_AUDIT_TEST_KEY>
// Returns the PDF inline. Does NOT send email, hit Stripe, or write DB.
// ==================================================================
interface TestProfile {
  name: string;
  expect: string; // what the narrative should do
  villa: Villa;
  comps: Comp[];
}

function makeSyntheticComps(villa: Villa, priceDeltas: number[]): Comp[] {
  // Builds 5 comps around the villa's price, using the given pct deltas
  // (relative to villa.last_price). Each comp has the same bedrooms/location.
  return priceDeltas.map((delta, i) => {
    const compPriceUsd = Math.round((villa.last_price || 100000) * (1 + delta));
    return {
      id: 9000 + i,
      slug: `synthetic-comp-${i + 1}`,
      villa_name: `Villa Comp ${String.fromCharCode(65 + i)}`,
      location: villa.location,
      bedrooms: villa.bedrooms,
      last_price: compPriceUsd * USD_RATE_FALLBACK, // store in IDR-equivalent like real rows
      price_description: `USD ${compPriceUsd.toLocaleString()}`,
      projected_roi: (villa.projected_roi || 6) + (Math.random() - 0.5) * 2,
      est_nightly_rate: (villa.est_nightly_rate || 100) * (1 + (Math.random() - 0.5) * 0.15),
      est_occupancy: villa.est_occupancy || 0.72,
      lease_years: villa.lease_years,
    };
  });
}

function buildTestProfile(n: number): TestProfile | null {
  // Profile templates. Each constructs a synthetic Villa + 5 synthetic comps.
  const base = (overrides: Partial<Villa>): Villa => ({
    id: 99000 + n,
    slug: `test-profile-${n}`,
    villa_name: "Test Villa",
    location: "Canggu",
    last_price: 180000,
    price_description: "USD 180,000",
    bedrooms: 3,
    projected_roi: 8,
    est_nightly_rate: 165,
    est_occupancy: 0.78,
    flags: null,
    lease_years: null,
    url: "https://balivillatruth.com",
    features: "Private pool, garden, parking",
    occupancy_confidence: "medium",
    occupancy_sample_size: 24,
    occupancy_source: "airdna",
    rate_source: "auditor",
    land_size: "250 m2",
    building_size: "180 m2",
    listing_type: "freehold",
    beds_baths: "3 beds, 3 baths",
    price_per_room: 60000,
    ...overrides,
  });

  switch (n) {
    case 1: {
      // Gold-standard: high yield, priced at median, freehold, clean flags.
      // Expect: new robust narrative; walk-away memo fires "clears hurdle" branch.
      const villa = base({
        villa_name: "P1 Gold Standard Canggu",
        location: "Canggu",
        last_price: 180000,
        price_description: "USD 180,000",
        projected_roi: 10.5,
        est_nightly_rate: 175,
        est_occupancy: 0.82,
        listing_type: "freehold",
      });
      return {
        name: "P1 — gold-standard Canggu (high yield, priced at median, freehold, clean)",
        expect: "Robust stress narrative. Walk-away memo fires 'clears hurdle' branch (walkAwayPrice > asking).",
        villa,
        comps: makeSyntheticComps(villa, [-0.04, -0.01, 0.02, 0.05, 0.08]),
      };
    }
    case 2: {
      // Overpriced: low yield, 25% above comps, freehold, clean flags.
      // Expect: anchor-on-comps premium narrative; walk-away memo pushes for discount.
      const villa = base({
        villa_name: "P2 Overpriced Seminyak",
        location: "Seminyak",
        last_price: 520000,
        price_description: "USD 520,000",
        projected_roi: 4.2,
        est_nightly_rate: 220,
        est_occupancy: 0.70,
        listing_type: "freehold",
        bedrooms: 3,
      });
      return {
        name: "P2 — overpriced Seminyak (low yield, 25% over comps, clean)",
        expect: "Premium anchor narrative. Walk-away memo fires discount-required branch.",
        villa,
        comps: makeSyntheticComps(villa, [-0.30, -0.25, -0.20, -0.18, -0.14]),
      };
    }
    case 3: {
      // Fragile leasehold: med yield, median-priced, 20y lease.
      // Expect: lease-extension bullet in memo; mid-range stress narrative.
      const villa = base({
        villa_name: "P3 Fragile Sanur Leasehold",
        location: "Sanur",
        last_price: 107258,
        price_description: "IDR 1,800,000,000",
        projected_roi: 5.9,
        est_nightly_rate: 72,
        est_occupancy: 0.80,
        listing_type: "leasehold",
        lease_years: 20,
        bedrooms: 2,
      });
      return {
        name: "P3 — Sanur leasehold (med yield, median-priced, 20y lease)",
        expect: "Fragility narrative (worst < 3%). Lease-extension bullet in memo.",
        villa,
        comps: makeSyntheticComps(villa, [-0.06, -0.02, 0.01, 0.04, 0.08]),
      };
    }
    case 4: {
      // Budget red flag: high yield, priced below comps, BUDGET_VILLA + SHORT_LEASE.
      // Expect: contradictory signals — yield is strong but flags warn you off.
      // This is the profile most likely to surface narrative inconsistency.
      const villa = base({
        villa_name: "P4 Budget Red-Flag Ungasan",
        location: "Ungasan",
        last_price: 95000,
        price_description: "USD 95,000",
        projected_roi: 9.3,
        est_nightly_rate: 110,
        est_occupancy: 0.72,
        listing_type: "leasehold",
        lease_years: 18,
        flags: "BUDGET_VILLA,SHORT_LEASE",
        bedrooms: 2,
      });
      return {
        name: "P4 — budget red-flag Ungasan (high yield + BUDGET + SHORT_LEASE)",
        expect: "Yield looks strong, flags warn. Test narrative coherence on contradictory signals.",
        villa,
        comps: makeSyntheticComps(villa, [0.10, 0.15, 0.22, 0.28, 0.35]),
      };
    }
    case 5: {
      // Stress-able: very low yield, big villa, opex/occ pressure pushes worst negative.
      // Expect: cash-flow-negative branch fires in stress narrative.
      const villa = base({
        villa_name: "P5 Stress-Fragile Uluwatu",
        location: "Uluwatu",
        last_price: 650000,
        price_description: "USD 650,000",
        projected_roi: 3.1,
        est_nightly_rate: 240,
        est_occupancy: 0.58,
        listing_type: "freehold",
        bedrooms: 4,
      });
      return {
        name: "P5 — stress-fragile Uluwatu (3.1% yield, large villa)",
        expect: "Double-shock may push net yield negative → cash-flow-negative branch.",
        villa,
        comps: makeSyntheticComps(villa, [-0.10, -0.05, 0.02, 0.08, 0.14]),
      };
    }
    case 6: {
      // Flag stack: OFF_PLAN + SHORT_LEASE, med yield.
      // Expect: both flag bullets fire in memo; stress narrative middling.
      const villa = base({
        villa_name: "P6 Off-Plan Short-Lease Canggu",
        location: "Canggu",
        last_price: 245000,
        price_description: "USD 245,000",
        projected_roi: 6.8,
        est_nightly_rate: 195,
        est_occupancy: 0.75,
        listing_type: "leasehold",
        lease_years: 22,
        flags: "OFF_PLAN,SHORT_LEASE",
        bedrooms: 3,
      });
      return {
        name: "P6 — off-plan + short-lease Canggu (med yield, flags stack)",
        expect: "Both OFF_PLAN and SHORT_LEASE bullets render in memo.",
        villa,
        comps: makeSyntheticComps(villa, [-0.08, -0.03, 0.02, 0.08, 0.15]),
      };
    }
    default:
      return null;
  }
}

async function handleTest(profileNum: number, key: string): Promise<Response> {
  // Secret gate. Without DEEP_AUDIT_TEST_KEY set in Vercel env, the test
  // endpoint is inert. With it set, the caller must supply the matching
  // key query param. This keeps the endpoint out of search-engine reach
  // while still being a one-curl test.
  const expectedKey = (process.env.DEEP_AUDIT_TEST_KEY || "").trim();
  if (!expectedKey) {
    return NextResponse.json(
      { error: "Test mode disabled. Set DEEP_AUDIT_TEST_KEY in the env to enable." },
      { status: 503 }
    );
  }
  if (key !== expectedKey) {
    return NextResponse.json({ error: "Invalid test key" }, { status: 403 });
  }
  if (!Number.isInteger(profileNum) || profileNum < 1 || profileNum > 6) {
    return NextResponse.json(
      { error: "profile must be an integer 1-6" },
      { status: 400 }
    );
  }

  const profile = buildTestProfile(profileNum);
  if (!profile) {
    return NextResponse.json({ error: "Unknown profile" }, { status: 400 });
  }

  // Run the full pipeline inside a single try so any failure surfaces the
  // actual stack to the caller (stripped but useful) instead of a blank 500.
  try {
    const audit = computeAudit(profile.villa, USD_RATE_FALLBACK);
    const scenarios = buildScenarios(audit);
    const memo = buildNegotiationMemo(profile.villa, audit, profile.comps);
    const exits = buildExitScenarios(audit);
    const pdfBuffer = await generateDeepPdf(
      profile.villa,
      audit,
      profile.comps,
      "exact",
      scenarios,
      memo,
      exits
    );

    // Wrap the Node Buffer in a Uint8Array view (shares memory, no copy).
    // Uint8Array is a valid BodyInit and compiles cleanly under Next's types —
    // Buffer.buffer / .slice() return ArrayBufferLike which TS rejects.
    const body = new Uint8Array(pdfBuffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="BVT-TestProfile-${profileNum}.pdf"`,
        "X-Test-Profile": profile.name,
        "X-Test-Expectation": profile.expect,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // Surface the error to the caller so the test harness isn't blind.
    // In prod this function is only reachable with the test key, so leaking
    // the message is acceptable (low blast radius).
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? (err.stack || "").split("\n").slice(0, 6).join("\n") : "";
    console.error(`[test pdf] profile ${profileNum} failed:`, err);
    return NextResponse.json(
      { error: "Test PDF generation failed", message: msg, stack, profile: profile.name },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testParam = searchParams.get("test");
  if (testParam) {
    const key = searchParams.get("key") || "";
    return handleTest(parseInt(testParam, 10), key);
  }
  const session_id = searchParams.get("session_id") || "";
  return handle(session_id);
}
export async function POST(req: NextRequest) {
  try {
    const { session_id } = (await req.json()) as { session_id?: string };
    return handle(session_id || "");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
