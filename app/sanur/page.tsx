import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "sanur",
  name: "Sanur",
  tagline: "Slower demand, steadier fundamentals",
  intro:
    "Sanur is Bali's quiet coast — older tourism infrastructure, family-friendly, less nightlife, and a long-stay retiree demographic that keeps occupancy respectable without the nightly-rate volatility of Canggu or Uluwatu. That profile means lower gross yields on paper but often a cleaner net picture: less competition for new guests, lower OTA fees, and a renter base that stays 2-4 weeks instead of 3 nights. Good for buyers who prize stability over headline yield numbers.",
  pros: [
    "Long-stay renter base reduces OTA commissions and turnover costs",
    "Lower entry prices than Canggu or Seminyak for comparable build quality",
    "Traffic and congestion are meaningfully better than the west coast",
    "New Nusa Penida ferry port has quietly boosted mid-season demand",
  ],
  cons: [
    "Nightly rates plateau lower — gross yields are weaker on paper",
    "Buyer pool for resale is narrower; exit takes longer",
    "Older building stock dominates — capex budgets matter",
    "Limited walk-to nightlife means the Airbnb-only crowd is a harder sell",
  ],
  priceBand: "$180k – $900k USD",
  nightlyBand: "$80 – $300 / night",
  matchLocations: ["Sanur", "Denpasar", "Renon"],
  neighbors: [
    { slug: "canggu", name: "Canggu" },
    { slug: "uluwatu", name: "Uluwatu" },
    { slug: "seminyak", name: "Seminyak" },
  ],
};

export const metadata: Metadata = {
  title: "Sanur Villa Investments — Audited ROI Analysis",
  description:
    "Independent ROI audit of Sanur villa investments. Net yields, lease depreciation, and long-stay occupancy modeling on every audited Sanur-area listing.",
  alternates: { canonical: "https://balivillatruth.com/sanur" },
  openGraph: {
    title: "Sanur Villa Investments — Audited ROI Analysis",
    description:
      "Steady-coast Sanur yields, audited with the long-stay renter base in mind.",
    url: "https://balivillatruth.com/sanur",
  },
};

export const revalidate = 3600;

export default function SanurPage() {
  return <AreaPage cfg={cfg} />;
}
