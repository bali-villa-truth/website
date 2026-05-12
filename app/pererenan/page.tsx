import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "pererenan",
  name: "Pererenan",
  tagline: "The quieter Canggu bet with rising supply risk",
  intro:
    "Pererenan attracts buyers who want Canggu rental demand without Berawa-level intensity. The area can work well for design-led villas with calm surroundings and beach access, but the investment case depends on not overpaying for the 'next Canggu' story. Our Pererenan audits model realistic nightly rates, area occupancy, 40% operating costs, and lease decay so buyers can separate genuine yield from appreciation-driven sales copy.",
  pros: [
    "Strong overflow demand from Canggu with a calmer guest experience",
    "Lifestyle appeal for longer-stay renters and remote workers",
    "Some pockets still price below prime Berawa and Batu Bolong",
    "Good fit for boutique villas with privacy and strong design",
  ],
  cons: [
    "Rapid construction can undermine the quiet-neighborhood premium",
    "Some listings price in future appreciation before income supports it",
    "Road access and traffic vary materially by micro-location",
    "Lease extensions need careful diligence before assuming exit value",
  ],
  priceBand: "$180k - $1.1M USD",
  nightlyBand: "$110 - $330 / night",
  matchLocations: ["Pererenan", "Seseh"],
  neighbors: [
    { slug: "canggu", name: "Canggu" },
    { slug: "berawa", name: "Berawa" },
    { slug: "uluwatu", name: "Uluwatu" },
  ],
};

export const metadata: Metadata = {
  title: "Pererenan Villa Investment ROI — Net Yield Audits",
  description:
    "Independent Pererenan villa investment analysis. Compare audited net yields, lease risk, operating costs, and red flags for Pererenan and Seseh villas.",
  alternates: { canonical: "https://balivillatruth.com/pererenan" },
  openGraph: {
    title: "Pererenan Villa Investment ROI — Net Yield Audits",
    description:
      "Stress-tested Pererenan villa yields for buyers who want conservative math before investing.",
    url: "https://balivillatruth.com/pererenan",
  },
};

export const revalidate = 3600;

export default function PererenanPage() {
  return <AreaPage cfg={cfg} />;
}
