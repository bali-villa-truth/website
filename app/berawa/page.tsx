import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "berawa",
  name: "Berawa",
  tagline: "Premium Canggu pricing, tighter underwriting required",
  intro:
    "Berawa sits in the most expensive part of the Canggu rental corridor: beach clubs, international schools, short-stay demand, and fast resale liquidity. The same demand that supports strong nightly rates also pushes land and villa asking prices into thin-yield territory. Our Berawa audits stress-test whether the rental premium survives 40% operating costs, short lease terms, and the competition from new investor-grade villas coming online every season.",
  pros: [
    "High nightly rates supported by beach-club tourism and long-stay expats",
    "Strong resale liquidity compared with quieter Bali submarkets",
    "Premium guest profile can support better ADR for finished, well-managed villas",
    "Deep management ecosystem makes professional operation easier to source",
  ],
  cons: [
    "Entry prices are high, so small underwriting errors can erase net yield",
    "Traffic and construction noise can affect guest reviews and occupancy",
    "Short leaseholds are common and can materially dilute returns",
    "Many new builds make brochure ROI claims that need aggressive verification",
  ],
  priceBand: "$250k - $1.5M USD",
  nightlyBand: "$140 - $400 / night",
  matchLocations: ["Berawa"],
  neighbors: [
    { slug: "canggu", name: "Canggu" },
    { slug: "pererenan", name: "Pererenan" },
    { slug: "seminyak", name: "Seminyak" },
  ],
};

export const metadata: Metadata = {
  title: "Berawa Villa Investment ROI — Independent Audits",
  description:
    "Independent Berawa villa investment audits. Stress-tested net yields, lease depreciation, management costs, and red flags for Berawa villas near Canggu.",
  alternates: { canonical: "https://balivillatruth.com/berawa" },
  openGraph: {
    title: "Berawa Villa Investment ROI — Independent Audits",
    description:
      "Net-yield audits for Berawa villas. Built for buyers who want the math before the sales pitch.",
    url: "https://balivillatruth.com/berawa",
  },
};

export const revalidate = 3600;

export default function BerawaPage() {
  return <AreaPage cfg={cfg} />;
}
