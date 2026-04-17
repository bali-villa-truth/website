import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "canggu",
  name: "Canggu",
  tagline: "High-demand, high-yield, high-competition",
  intro:
    "Canggu is the engine of Bali's modern villa rental market — a ribbon of surf beaches, co-working cafes, and boutique hotels running north from Seminyak. Daily rates and occupancy are the strongest on the island, but so is the supply of new-build investor villas. Our audit flags the ones chasing yield with short leases, inflated nightly rates, and unrealistic occupancy assumptions.",
  pros: [
    "Highest nightly rates in Bali outside Ubud's super-luxury tier",
    "Year-round demand — digital nomads through rainy season, tourists through dry",
    "Deepest rental agency ecosystem makes outsourcing management viable",
    "Resale liquidity is stronger than any other area we track",
  ],
  cons: [
    "New-build inventory glut is pushing occupancy down below the brochure numbers",
    "Traffic, noise, and construction can hurt guest reviews — site visits matter",
    "Leaseholds of 20-25 years are common here — watch the depreciation math",
    "Land prices rising faster than achievable yields in Berawa and Pererenan",
  ],
  priceBand: "$180k – $1.2M USD",
  nightlyBand: "$120 – $350 / night",
  matchLocations: ["Canggu", "Berawa", "Pererenan", "Echo Beach"],
  neighbors: [
    { slug: "seminyak", name: "Seminyak" },
    { slug: "uluwatu", name: "Uluwatu" },
    { slug: "sanur", name: "Sanur" },
  ],
};

export const metadata: Metadata = {
  title: "Canggu Villa Investments — Audited ROI Analysis",
  description:
    "Independent ROI audit of Canggu villa investments. Net yields, lease depreciation, red flags, and sensitivity analysis on every audited Canggu, Berawa, and Pererenan villa.",
  alternates: { canonical: "https://balivillatruth.com/canggu" },
  openGraph: {
    title: "Canggu Villa Investments — Audited ROI Analysis",
    description:
      "Stress-tested net yields on every audited Canggu villa. Built for buyers, not brokers.",
    url: "https://balivillatruth.com/canggu",
  },
};

export const revalidate = 3600;

export default function CangguPage() {
  return <AreaPage cfg={cfg} />;
}
