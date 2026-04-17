import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "ungasan",
  name: "Ungasan",
  tagline: "The Bukit's emerging investor corridor",
  intro:
    "Ungasan sits on the elevated Bukit Peninsula between Uluwatu's cliff villas and Jimbaran's beach crescent. Over the last three years it has become the largest bucket of new-build investor inventory outside Canggu — bigger plots, lower price-per-sqm than Uluwatu, and developers targeting the $200-600k foreign-buyer bracket. That scale comes with risk: off-plan execution, generic 'HIGH YIELD' marketing, and construction quality variance we flag aggressively.",
  pros: [
    "Lower price-per-sqm than neighboring Uluwatu or Jimbaran",
    "Larger plots — room for a pool, garden, and meaningful guest space",
    "Proximity to Uluwatu's rental demand without the cliff-land premium",
    "Community of new-build owners means operational knowledge is shared",
  ],
  cons: [
    "Very high share of off-plan listings — delivery risk is the dominant flag",
    "Nightly rate models that assume 'near Uluwatu' premiums often overshoot",
    "Infrastructure (water, roads) lags the pace of construction in parts",
    "Resale liquidity is untested — inventory is newer than a typical hold cycle",
  ],
  priceBand: "$180k – $900k USD",
  nightlyBand: "$120 – $400 / night",
  matchLocations: ["Ungasan", "Pecatu", "Jimbaran"],
  neighbors: [
    { slug: "uluwatu", name: "Uluwatu" },
    { slug: "canggu", name: "Canggu" },
    { slug: "sanur", name: "Sanur" },
  ],
};

export const metadata: Metadata = {
  title: "Ungasan Villa Investments — Audited ROI Analysis",
  description:
    "Independent ROI audit of Ungasan and Bukit Peninsula villa investments. Off-plan risk flags, conservative nightly-rate modeling, and net yield analysis on every audited Ungasan listing.",
  alternates: { canonical: "https://balivillatruth.com/ungasan" },
  openGraph: {
    title: "Ungasan Villa Investments — Audited ROI Analysis",
    description:
      "Bukit Peninsula villas audited with a suspicious eye on off-plan claims.",
    url: "https://balivillatruth.com/ungasan",
  },
};

export const revalidate = 3600;

export default function UngasanPage() {
  return <AreaPage cfg={cfg} />;
}
