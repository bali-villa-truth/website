import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "bingin",
  name: "Bingin",
  tagline: "Boutique surf demand, unforgiving micro-locations",
  intro:
    "Bingin is one of Bali's most emotionally compelling villa markets: surf, cliffs, sunset dining, and a guest base willing to pay for design and views. It is also a market where the wrong access road, lease term, or build constraint can destroy the underwriting. Our Bingin audits compare asking prices against realistic nightly rates and conservative operating costs so buyers can understand whether the premium is supported by income.",
  pros: [
    "Strong brand demand from surf, wedding, and boutique-travel guests",
    "Scarce view-driven inventory can support premium ADR",
    "Uluwatu area momentum improves resale narrative",
    "High design sensitivity rewards genuinely differentiated villas",
  ],
  cons: [
    "Access, parking, stairs, and noise vary dramatically by exact location",
    "Cliff and zoning constraints need serious local due diligence",
    "Small sample sizes make occupancy estimates less certain",
    "Premium asking prices can outrun achievable net yield",
  ],
  priceBand: "$220k - $1.4M USD",
  nightlyBand: "$130 - $450 / night",
  matchLocations: ["Bingin", "Pecatu"],
  neighbors: [
    { slug: "uluwatu", name: "Uluwatu" },
    { slug: "ungasan", name: "Ungasan" },
    { slug: "nusa-dua", name: "Nusa Dua" },
  ],
};

export const metadata: Metadata = {
  title: "Bingin Villa Investment ROI — Independent Net Yield Audits",
  description:
    "Independent Bingin villa investment audits. Stress-test net yield, cliff-area risk, lease terms, occupancy assumptions, and red flags before buying.",
  alternates: { canonical: "https://balivillatruth.com/bingin" },
  openGraph: {
    title: "Bingin Villa Investment ROI — Independent Net Yield Audits",
    description:
      "Audited Bingin villa yields with conservative operating costs and lease-depreciation math.",
    url: "https://balivillatruth.com/bingin",
  },
};

export const revalidate = 3600;

export default function BinginPage() {
  return <AreaPage cfg={cfg} />;
}
