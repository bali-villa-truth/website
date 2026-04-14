/**
 * /api/unlock-audit — Generates a villa audit PDF and emails it to the lead.
 *
 * Flow:
 *   1. Receive { email, villa_id } from the frontend modal
 *   2. Fetch villa data from Supabase
 *   3. Insert lead into Supabase leads table
 *   4. Generate audit PDF (pdfkit)
 *   5. Email PDF via Resend
 *   6. Return success to client
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback)
 *   RESEND_API_KEY
 *   RESEND_FROM_EMAIL
 *   RESEND_FROM_NAME
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

export const runtime = "nodejs";
export const maxDuration = 30;

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Villa {
  id: number;
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
// Colors (matching the brand)
// ------------------------------------------------------------------
const COLORS = {
  brandBlue: "#2563eb",
  brandBlueLight: "#dbeafe",
  yieldGreen: "#059669",
  yieldGreenBg: "#d1fae5",
  yieldAmber: "#d97706",
  yieldAmberBg: "#fef3c7",
  yieldRed: "#dc2626",
  yieldRedBg: "#fee2e2",
  slate900: "#0f172a",
  slate700: "#334155",
  slate500: "#64748b",
  slate300: "#cbd5e1",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  white: "#ffffff",
};

// ------------------------------------------------------------------
// Calculation helpers
// ------------------------------------------------------------------
const USD_RATE_FALLBACK = 17109; // matches last pipeline run

function computeAudit(villa: Villa, usdRate: number): AuditNumbers {
  const priceLocal = villa.last_price || 0;
  const priceDesc = villa.price_description || "";

  let priceUsd = 0;
  const usdMatch = priceDesc.match(/USD\s*([\d,]+)/i);
  if (usdMatch) {
    priceUsd = parseFloat(usdMatch[1].replace(/,/g, ""));
  }
  if (!priceUsd && priceLocal) {
    priceUsd = priceLocal / usdRate;
  }

  const nightlyRate = villa.est_nightly_rate || 0;
  const occupancy = villa.est_occupancy || 0.65;
  const leaseYears = villa.lease_years || 0;
  const bedrooms = villa.bedrooms || 0;
  const featuresLower = (villa.features || "").toLowerCase();
  const isLeasehold = featuresLower.includes("leasehold") ||
    (leaseYears > 0 && leaseYears < 99);

  const grossRevenue = nightlyRate * 365 * occupancy;
  const mgmtFees = grossRevenue * 0.15;
  const otaFees = grossRevenue * 0.15;
  const maintenance = grossRevenue * 0.1;
  const totalExpenses = mgmtFees + otaFees + maintenance;
  const netBeforeLease = grossRevenue - totalExpenses;

  let leaseCost = 0;
  if (isLeasehold && leaseYears > 0 && priceUsd > 0) {
    leaseCost = priceUsd / leaseYears;
  }
  const netRevenue = netBeforeLease - leaseCost;
  const grossYield = priceUsd > 0 ? (grossRevenue / priceUsd) * 100 : 0;
  let netYield = priceUsd > 0 ? (netRevenue / priceUsd) * 100 : 0;

  // Trust the stored projected_roi if present (pipeline-authoritative)
  if (villa.projected_roi !== null && villa.projected_roi !== undefined) {
    netYield = villa.projected_roi;
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
  if (pct >= 8) return { color: COLORS.yieldGreen, bg: COLORS.yieldGreenBg, label: "Strong" };
  if (pct >= 5) return { color: COLORS.yieldAmber, bg: COLORS.yieldAmberBg, label: "Moderate" };
  if (pct >= 0) return { color: COLORS.yieldRed, bg: COLORS.yieldRedBg, label: "Weak" };
  return { color: COLORS.yieldRed, bg: COLORS.yieldRedBg, label: "Negative" };
}

function flagExplanation(flag: string): { label: string; text: string } {
  const map: Record<string, { label: string; text: string }> = {
    BUDGET_VILLA: {
      label: "Budget Villa",
      text: "Asking price is below the 25th percentile for this area and bedroom tier. We discounted the nightly rate 30% because budget properties rarely command the same nightly rate as median-priced villas, even in the same area.",
    },
    EXTREME_BUDGET: {
      label: "Extreme Budget",
      text: "Asking price is below half the 25th percentile — very unusual. We discounted the nightly rate 50%. Worth checking whether the listing is accurate, the property is distressed, or there are legal/structural issues.",
    },
    NEAR_BUDGET: {
      label: "Near-Budget",
      text: "Asking price sits between the 25th and 35th percentile. Rate discounted 15% to reflect slightly-below-median positioning.",
    },
    MULTI_UNIT: {
      label: "Multi-Unit",
      text: "Listing is multiple villas sold together. Revenue projections assume all units are rented — verify management feasibility and whether units can be sold separately.",
    },
    OFF_PLAN: {
      label: "Off-Plan / Pre-Construction",
      text: "Villa isn't built yet. All yield numbers assume it gets completed on schedule, to spec, and achieves market rates from day one. Construction delays and build quality risk apply.",
    },
    SHORT_LEASE: {
      label: "Short Lease",
      text: "Fewer than 15 years remaining on the leasehold. Depreciation is aggressive — each year you own it, ~6-10% of value evaporates. Very high risk.",
    },
    OPTIMISTIC_ROI: {
      label: "Optimistic Yield",
      text: "Gross yield 15-20%. The gap between gross and net is where many investors get burned. Expect higher-than-modeled operating costs to eat into these returns.",
    },
    INFLATED_ROI: {
      label: "Inflated Yield",
      text: "Gross yield over 20% — suspicious. Either the property is genuinely underpriced, or the asking price doesn't reflect reality. Investigate before trusting the number.",
    },
    RATE_PRICE_GAP: {
      label: "Rate-Price Gap",
      text: "Implied ROI exceeds 30% on a sub-$200K property. Very unusual. Verify with direct market comps before acting.",
    },
    MISSING_DATA: {
      label: "Missing Data",
      text: "Key fields (price, bedrooms, or rate) couldn't be parsed from the source listing. Our estimates may be incomplete.",
    },
  };
  return map[flag] || { label: flag.replace(/_/g, " "), text: "Flagged for review." };
}

// ------------------------------------------------------------------
// PDF generation
// ------------------------------------------------------------------
function generatePdf(villa: Villa, audit: AuditNumbers): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 50, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: `BVT Audit — ${villa.villa_name || "Villa"}`,
          Author: "Bali Villa Truth",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // PDF is always 3 pages. Render footer inline on each page BEFORE
      // advancing so we're actively on the page when drawing (avoids
      // bufferPages+switchToPage pagination quirk that created 6 ghost pages).
      const TOTAL_PAGES = 3;

      // =========================================================
      // PAGE 1: Summary
      // =========================================================
      renderHeader(doc, villa);
      renderYieldHero(doc, audit);
      renderKeyStats(doc, villa, audit);
      renderVerdict(doc, villa, audit);
      renderFlags(doc, villa);
      renderFooter(doc, 1, TOTAL_PAGES);

      // =========================================================
      // PAGE 2: The Math
      // =========================================================
      doc.addPage();
      renderMathSection(doc, villa, audit);
      renderConfidenceSection(doc, villa, audit);
      renderFooter(doc, 2, TOTAL_PAGES);

      // =========================================================
      // PAGE 3: 5-Year Projection
      // =========================================================
      doc.addPage();
      renderProjection(doc, audit);
      renderSensitivity(doc, audit);
      renderQuestions(doc);
      renderFinalDisclaimer(doc);
      renderFooter(doc, 3, TOTAL_PAGES);

      // (Footer loop removed — now rendered inline above.)
      // Keeping the buffer loop no-op-safe in case anything else needs it.
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        // intentionally empty — footer already rendered inline
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function renderHeader(doc: PDFKit.PDFDocument, villa: Villa) {
  // Wordmark
  doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.slate900)
    .text("Bali Villa ", 50, 50, { continued: true })
    .fillColor(COLORS.brandBlue).text("Truth", { continued: false });

  // Date
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.fontSize(9).font("Helvetica").fillColor(COLORS.slate500)
    .text(`Audit Report · ${today}`, 50, 52, { align: "right", width: 512 });

  // Rule
  doc.moveTo(50, 72).lineTo(562, 72).lineWidth(0.5).strokeColor(COLORS.slate300).stroke();

  // Villa name
  const name = (villa.villa_name || "Unnamed Villa").trim();
  doc.fontSize(15).font("Helvetica-Bold").fillColor(COLORS.slate900)
    .text(name, 50, 86, { width: 512 });

  const location = villa.location || "Bali, Indonesia";
  doc.fontSize(10).font("Helvetica").fillColor(COLORS.slate500).text(location, 50, doc.y + 2);

  doc.y = Math.max(doc.y + 18, 140);
}

function renderYieldHero(doc: PDFKit.PDFDocument, audit: AuditNumbers) {
  const tier = yieldTier(audit.net_yield_pct);
  const yTop = doc.y;
  doc.rect(50, yTop, 512, 100).fill(tier.bg);
  doc.rect(50, yTop, 512, 100).lineWidth(1).strokeColor(tier.color).stroke();

  doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.slate500)
    .text("PROJECTED NET YIELD", 50, yTop + 10, { width: 512, align: "center", characterSpacing: 1 });

  doc.fontSize(48).font("Helvetica-Bold").fillColor(tier.color)
    .text(fmtPct(audit.net_yield_pct), 50, yTop + 24, { width: 512, align: "center" });

  doc.fontSize(10).font("Helvetica-Bold").fillColor(tier.color)
    .text(`${tier.label}  ·  Gross yield ${fmtPct(audit.gross_yield_pct)}`,
          50, yTop + 78, { width: 512, align: "center" });

  doc.y = yTop + 115;
}

function renderKeyStats(doc: PDFKit.PDFDocument, villa: Villa, audit: AuditNumbers) {
  const leaseLabel = audit.is_leasehold && audit.lease_years
    ? `${audit.lease_type} · ${audit.lease_years}yr remaining`
    : audit.lease_type;

  const rows: [string, string][] = [
    ["Asking Price", fmtCurrency(audit.price_usd)],
    ["Local Price", audit.price_desc || "—"],
    ["Bedrooms", String(audit.bedrooms || "—")],
    ["Ownership", leaseLabel],
    ["Est. Nightly Rate", `${fmtCurrency(audit.nightly_rate)}/night`],
    ["Est. Occupancy", fmtPct(audit.occupancy * 100, 0)],
  ];

  const rowHeight = 22;
  const labelW = 180;
  let y = doc.y;

  rows.forEach((row, i) => {
    if (i % 2 === 0) {
      doc.rect(50, y, 512, rowHeight).fill(COLORS.slate50);
    }
    doc.fontSize(9.5).font("Helvetica-Bold").fillColor(COLORS.slate500)
      .text(row[0], 60, y + 7, { width: labelW - 10 });
    doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.slate900)
      .text(row[1], 60 + labelW, y + 7, { width: 512 - labelW - 20 });
    y += rowHeight;
  });

  doc.y = y + 16;
}

function renderVerdict(doc: PDFKit.PDFDocument, villa: Villa, audit: AuditNumbers) {
  sectionHeader(doc, "Our Verdict");

  const y = audit.net_yield_pct;
  const rate = audit.nightly_rate;
  const occ = audit.occupancy * 100;

  let intro: string;
  if (y >= 8) {
    intro = `This villa projects a ${fmtPct(y)} net yield, which is strong by Bali standards. `;
  } else if (y >= 5) {
    intro = `This villa projects a ${fmtPct(y)} net yield, which is moderate — typical for well-priced Bali villas but not exceptional. `;
  } else if (y >= 0) {
    intro = `This villa projects a ${fmtPct(y)} net yield, which is weak. The asking price is high relative to what comparable villas earn. `;
  } else {
    intro = `This villa projects a negative ${fmtPct(y)} net yield. Rental income won't cover operating costs and lease depreciation. `;
  }

  let body = `Based on an estimated ${fmtCurrency(rate)}/night at ${fmtPct(occ, 0)} occupancy, the villa would generate roughly ${fmtCurrency(audit.gross_revenue)} in gross annual revenue. After standard 40% operating costs`;
  if (audit.is_leasehold && audit.lease_cost > 0) {
    body += ` and ${fmtCurrency(audit.lease_cost)}/year in lease depreciation`;
  }
  body += `, net cashflow is about ${fmtCurrency(audit.net_revenue)} on a ${fmtCurrency(audit.price_usd)} purchase.`;

  doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.slate700)
    .text(intro + body, 50, doc.y, { width: 512, lineGap: 3 });

  doc.y += 12;
}

function renderFlags(doc: PDFKit.PDFDocument, villa: Villa) {
  const flagsStr = villa.flags || "";
  const flags = flagsStr.split(",").map((f) => f.trim()).filter(Boolean);
  if (flags.length === 0) return;

  sectionHeader(doc, "Flags We Detected");

  flags.forEach((flag) => {
    const { label, text } = flagExplanation(flag);
    doc.fontSize(9.5).font("Helvetica-Bold").fillColor(COLORS.yieldAmber)
      .text(`⚠ ${label} `, 50, doc.y, { continued: true });
    doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.slate700)
      .text(`— ${text}`, { width: 512, lineGap: 2 });
    doc.y += 6;
  });
}

function renderMathSection(doc: PDFKit.PDFDocument, villa: Villa, audit: AuditNumbers) {
  sectionHeader(doc, "How We Got to the Number");
  doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.slate700)
    .text("Every yield on Bali Villa Truth follows the same formula. No adjustments, no cherry-picking. Here's the math for this specific villa:",
          50, doc.y, { width: 512, lineGap: 3 });

  doc.y += 10;

  const rows: [string, string, string][] = [
    ["Gross Annual Revenue",
     `${fmtCurrency(audit.nightly_rate)}/nt × 365 × ${fmtPct(audit.occupancy * 100, 0)} occ`,
     fmtCurrency(audit.gross_revenue)],
    ["− Management (15%)", "Standard Bali property-management cut", `−${fmtCurrency(audit.mgmt_fees)}`],
    ["− OTA/Booking Fees (15%)", "Airbnb, Booking.com commissions", `−${fmtCurrency(audit.ota_fees)}`],
    ["− Maintenance (10%)", "Pool, garden, AC, wifi, repairs", `−${fmtCurrency(audit.maintenance)}`],
    ["Net Revenue (pre-lease)", "Gross − operating costs",
     fmtCurrency(audit.gross_revenue - audit.total_expenses)],
  ];
  if (audit.is_leasehold && audit.lease_cost > 0) {
    rows.push(["− Lease Depreciation",
               `${fmtCurrency(audit.price_usd)} ÷ ${audit.lease_years} years`,
               `−${fmtCurrency(audit.lease_cost)}`]);
  }
  rows.push(["Net Annual Cashflow", "What lands in your pocket each year", fmtCurrency(audit.net_revenue)]);
  rows.push(["÷ Asking Price", fmtCurrency(audit.price_usd), ""]);
  rows.push(["= NET YIELD", "", fmtPct(audit.net_yield_pct)]);

  renderThreeColTable(doc, rows, [180, 220, 112]);

  doc.y += 14;
}

function renderConfidenceSection(doc: PDFKit.PDFDocument, villa: Villa, audit: AuditNumbers) {
  sectionHeader(doc, "Data Confidence");

  const occConf = villa.occupancy_confidence || "—";
  const occN = villa.occupancy_sample_size || 0;
  const occSource = villa.occupancy_source || "flat 65% assumption";
  const rateSource = villa.rate_source || "scraper";

  const headerRow = ["Source", "Value", "Confidence"];
  const rows: string[][] = [
    headerRow,
    ["Nightly Rate",
     rateSource.replace(/_/g, " "),
     "Area median from Booking.com + Airbnb (n≈200-500 listings/area)"],
    ["Occupancy",
     `${fmtPct(audit.occupancy * 100, 0)} (${occSource})`,
     occN > 0 ? `${occConf.toUpperCase()} (n=${occN})` : "Flat assumption"],
    ["Asking Price", villa.price_description || "—", "Scraped from Bali Home Immo listing"],
    ["Lease Years",
     audit.lease_years ? String(audit.lease_years) : "N/A (Freehold)",
     "From listing description"],
  ];

  renderDataTable(doc, rows, [95, 170, 247]);
}

function renderProjection(doc: PDFKit.PDFDocument, audit: AuditNumbers) {
  sectionHeader(doc, "5-Year Cashflow Projection");
  doc.fontSize(8.5).font("Helvetica").fillColor(COLORS.slate500)
    .text("Assumes flat rates and occupancy. Real-world performance varies year to year. Cumulative Return sums all net annual cashflows (ignores resale — which for leaseholds trends toward zero anyway).",
          50, doc.y, { width: 512, lineGap: 2 });

  doc.y += 10;

  const rows: string[][] = [["Year", "Gross Rev", "Op. Costs", "Lease Cost", "Net Cashflow", "Cumulative"]];
  let cumulative = 0;
  for (let yr = 1; yr <= 5; yr++) {
    cumulative += audit.net_revenue;
    rows.push([
      `Year ${yr}`,
      fmtCurrency(audit.gross_revenue),
      `−${fmtCurrency(audit.total_expenses)}`,
      audit.is_leasehold ? `−${fmtCurrency(audit.lease_cost)}` : "N/A",
      fmtCurrency(audit.net_revenue),
      fmtCurrency(cumulative),
    ]);
  }
  rows.push([
    "5-Year Total",
    fmtCurrency(audit.gross_revenue * 5),
    `−${fmtCurrency(audit.total_expenses * 5)}`,
    audit.is_leasehold ? `−${fmtCurrency(audit.lease_cost * 5)}` : "N/A",
    fmtCurrency(audit.net_revenue * 5),
    fmtCurrency(cumulative),
  ]);

  renderDataTable(doc, rows, [70, 85, 85, 85, 95, 92], true);

  doc.y += 14;
}

function renderSensitivity(doc: PDFKit.PDFDocument, audit: AuditNumbers) {
  sectionHeader(doc, "Sensitivity — What If the Model's Wrong?");
  doc.fontSize(8.5).font("Helvetica").fillColor(COLORS.slate500)
    .text("Yields shift when real-world rates or occupancy differ. Here's how the net yield changes under different scenarios:",
          50, doc.y, { width: 512, lineGap: 2 });

  doc.y += 8;

  const rateMultipliers = [0.8, 0.9, 1.0, 1.1];
  const occScenarios: [string, number][] = [
    ["Occupancy −15%", audit.occupancy - 0.15],
    ["Base Occupancy", audit.occupancy],
    ["Occupancy +15%", audit.occupancy + 0.15],
  ];

  const header = ["", "Rate −20%", "Rate −10%", "Base Rate", "Rate +10%"];
  const rows: string[][] = [header];

  occScenarios.forEach(([label, occ]) => {
    const clamped = Math.max(0.2, Math.min(0.95, occ));
    const row = [label];
    rateMultipliers.forEach((rm) => {
      const rate = audit.nightly_rate * rm;
      const gross = rate * 365 * clamped;
      const net = gross * 0.6 - audit.lease_cost;
      const y = audit.price_usd > 0 ? (net / audit.price_usd) * 100 : 0;
      row.push(fmtPct(y));
    });
    rows.push(row);
  });

  renderDataTable(doc, rows, [112, 100, 100, 100, 100]);

  doc.y += 14;
}

function renderQuestions(doc: PDFKit.PDFDocument) {
  sectionHeader(doc, "Questions to Ask the Agent");
  doc.fontSize(8.5).font("Helvetica").fillColor(COLORS.slate500)
    .text("Before you trust any seller's claims, walk in with these questions. Honest sellers answer them directly. Evasion is a signal.",
          50, doc.y, { width: 512, lineGap: 2 });

  doc.y += 6;

  const questions = [
    "What was the actual occupancy rate over the past 12 months — with bookings data, not estimates?",
    "Can you share the existing property management contract and monthly cost reports?",
    "What were the last three years of gross rental revenue (documented, not projected)?",
    "How many days was the villa blocked for owner use vs. truly available?",
    "What's the current state of Pondok Wisata licensing and tourist tax compliance?",
    "For leasehold: what's the exact remaining term? Is there a renewal option, and at what cost?",
    "What major maintenance or capex has been deferred? (Pool resurfacing, roof, AC replacements)",
    "Who holds the land title? Can I verify via the local Notaris/PPAT before signing?",
  ];

  questions.forEach((q, i) => {
    doc.fontSize(9.5).font("Helvetica-Bold").fillColor(COLORS.slate900)
      .text(`${i + 1}. `, 50, doc.y, { continued: true });
    doc.fontSize(9.5).font("Helvetica").fillColor(COLORS.slate700)
      .text(q, { width: 512, lineGap: 2 });
    doc.y += 4;
  });

  doc.y += 8;
}

function renderFinalDisclaimer(doc: PDFKit.PDFDocument) {
  const yTop = doc.y;
  const h = 56;
  doc.rect(50, yTop, 512, h).fill(COLORS.yieldAmberBg);
  doc.rect(50, yTop, 512, h).lineWidth(0.5).strokeColor(COLORS.yieldAmber).stroke();
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLORS.slate900)
    .text("Remember: ", 62, yTop + 10, { continued: true });
  doc.font("Helvetica").fillColor(COLORS.slate700)
    .text("These numbers are estimates based on market-average data. We don't have access to the actual property's books. A villa that outperforms these estimates earns you upside — one that underperforms costs you money. Always verify with the seller and hire independent inspection/legal before closing.",
          { width: 488, lineGap: 2 });
}

function renderFooter(doc: PDFKit.PDFDocument, pageNum: number, total: number) {
  // Writing in the bottom margin area triggers pdfkit's auto-pagination
  // (which was creating 6 ghost pages). Temporarily zero out the bottom
  // margin so pdfkit thinks there's room, then restore it.
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  const y = 755;
  doc.fontSize(7).font("Helvetica").fillColor(COLORS.slate500)
    .text(
      "Not financial advice. Estimates based on market-average data, not audited owner books. Verify independently before investing.  |  balivillatruth.com",
      50, y, { width: 512, align: "center", lineBreak: false }
    );
  doc.fontSize(7).fillColor(COLORS.slate500)
    .text(`Page ${pageNum} of ${total}`, 50, y, { width: 512, align: "right", lineBreak: false });
  doc.page.margins.bottom = savedBottom;
}

// ------------------------------------------------------------------
// Table helpers
// ------------------------------------------------------------------
function sectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.y += 4;
  doc.fontSize(13).font("Helvetica-Bold").fillColor(COLORS.brandBlue)
    .text(title, 50, doc.y, { width: 512 });
  doc.y += 4;
}

function renderThreeColTable(doc: PDFKit.PDFDocument, rows: [string, string, string][], widths: number[]) {
  let y = doc.y;
  const rowH = 20;

  rows.forEach((row, i) => {
    const isLast = i === rows.length - 1;
    if (isLast) {
      doc.rect(50, y, 512, rowH).fill(COLORS.brandBlueLight);
    } else if (i % 2 === 0) {
      doc.rect(50, y, 512, rowH).fill(COLORS.slate50);
    }

    const labelColor = isLast ? COLORS.brandBlue : COLORS.slate900;
    const descColor = isLast ? COLORS.brandBlue : COLORS.slate500;
    const valueColor = isLast ? COLORS.brandBlue : COLORS.slate900;
    const fontSize = isLast ? 11 : 9;

    doc.fontSize(fontSize).font("Helvetica-Bold").fillColor(labelColor)
      .text(row[0], 60, y + 6, { width: widths[0] - 10 });
    doc.fontSize(fontSize - 1).font("Helvetica").fillColor(descColor)
      .text(row[1], 60 + widths[0], y + 6, { width: widths[1] - 10 });
    doc.fontSize(fontSize).font("Helvetica-Bold").fillColor(valueColor)
      .text(row[2], 60 + widths[0] + widths[1], y + 6, { width: widths[2] - 10, align: "right" });

    y += rowH;
  });

  doc.y = y;
}

function renderDataTable(doc: PDFKit.PDFDocument, rows: string[][], widths: number[], totalRow: boolean = false) {
  let y = doc.y;
  const rowH = 20;

  rows.forEach((row, i) => {
    const isHeader = i === 0;
    const isLast = totalRow && i === rows.length - 1;

    if (isHeader) {
      doc.rect(50, y, 512, rowH).fill(COLORS.slate100);
    } else if (isLast) {
      doc.rect(50, y, 512, rowH).fill(COLORS.brandBlueLight);
    }

    let x = 50;
    row.forEach((cell, j) => {
      const align = j === 0 ? "left" : "right";
      const color = isLast ? COLORS.brandBlue : isHeader ? COLORS.slate700 : COLORS.slate700;
      const font = isHeader || isLast ? "Helvetica-Bold" : "Helvetica";
      doc.fontSize(8.5).font(font).fillColor(color)
        .text(cell, x + 8, y + 6, { width: widths[j] - 16, align });
      x += widths[j];
    });

    // Cell borders
    doc.lineWidth(0.3).strokeColor(COLORS.slate300);
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
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
  <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">
    <div style="padding:24px 28px; border-bottom:1px solid #e2e8f0;">
      <div style="font-size:18px; font-weight:bold;">
        Bali Villa <span style="color:#2563eb;">Truth</span>
      </div>
    </div>
    <div style="padding:28px;">
      <h1 style="font-size:20px; margin:0 0 12px; line-height:1.3;">Your audit for ${escapeHtml(name)}</h1>
      <p style="color:#475569; line-height:1.6; margin:0 0 20px;">
        We've attached your full 3-page audit PDF. Here's the top-line number:
      </p>

      <div style="background:${tier.bg}; border:1px solid ${tier.color}; border-radius:8px; padding:20px; text-align:center; margin:20px 0;">
        <div style="font-size:10px; font-weight:bold; color:#64748b; letter-spacing:1px;">PROJECTED NET YIELD</div>
        <div style="font-size:36px; font-weight:bold; color:${tier.color}; margin:6px 0;">
          ${fmtPct(audit.net_yield_pct)}
        </div>
        <div style="font-size:11px; color:${tier.color}; font-weight:bold;">
          ${tier.label} · Gross yield ${fmtPct(audit.gross_yield_pct)}
        </div>
      </div>

      <p style="color:#475569; line-height:1.6; margin:16px 0;">
        The attached PDF includes the full math breakdown, 5-year cashflow projection, sensitivity analysis,
        and a list of questions to ask the agent before you commit.
      </p>

      <div style="background:#fef3c7; border:1px solid #d97706; border-radius:6px; padding:14px; font-size:13px; color:#78350f; margin:20px 0;">
        <strong>Not financial advice.</strong> These numbers are estimates based on market-average data —
        not audited owner books. Verify independently before investing.
      </div>

      ${villa.url ? `<p style="margin:16px 0;">
        <a href="${villa.url}" style="display:inline-block; background:#2563eb; color:white; padding:10px 18px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:13px;">View original listing →</a>
      </p>` : ""}

      <p style="color:#94a3b8; font-size:12px; line-height:1.5; margin-top:24px;">
        You're receiving this because you requested an audit at balivillatruth.com.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ------------------------------------------------------------------
// API route handler
// ------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, villa_id } = body as { email?: string; villa_id?: number };

    if (!email || !villa_id) {
      return NextResponse.json({ error: "email and villa_id are required" }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Env
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const resendKey = process.env.RESEND_API_KEY!;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "audits@balivillatruth.com";
    const fromName = process.env.RESEND_FROM_NAME || "Bali Villa Truth";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    if (!resendKey) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch villa
    const { data: villa, error: villaErr } = await supabase
      .from("listings_tracker")
      .select("*")
      .eq("id", villa_id)
      .limit(1)
      .single();

    if (villaErr || !villa) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    // 2. Insert lead (don't block on error — non-critical)
    await supabase.from("leads").insert([{
      email,
      villa_id,
      villa_name: villa.villa_name,
      lead_type: "Audit PDF",
    }]);

    // 3. Compute audit + generate PDF
    const audit = computeAudit(villa as Villa, USD_RATE_FALLBACK);
    const pdfBuffer = await generatePdf(villa as Villa, audit);

    // 4. Send email
    const resend = new Resend(resendKey);
    const safeName = ((villa.villa_name || "villa").slice(0, 40)).replace(/[^a-zA-Z0-9-_]/g, "_");
    const { error: sendErr } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: `Your Bali Villa Truth audit — ${(villa.villa_name || "villa").slice(0, 60)}`,
      html: buildEmailHtml(villa as Villa, audit),
      attachments: [{
        filename: `BVT-Audit-${safeName}.pdf`,
        content: pdfBuffer,
      }],
    });

    if (sendErr) {
      console.error("Resend error:", sendErr);
      return NextResponse.json({ error: "Failed to send audit email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Audit emailed. Check your inbox.",
      source_url: villa.url || null,
    });
  } catch (err: any) {
    console.error("unlock-audit error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
