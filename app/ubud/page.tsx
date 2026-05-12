import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "ubud",
  name: "Ubud",
  tagline: "Wellness demand with distance and access trade-offs",
  intro:
    "Ubud villas can produce strong guest demand when the product matches the market: privacy, jungle outlooks, wellness positioning, and thoughtful design. The risk is that Ubud is not one market. A villa near restaurants and retreats underwrites differently from a remote jungle property with difficult access. Our Ubud audits stress-test nightly rates, occupancy, operating costs, and lease depreciation so buyers can compare the income case across very different micro-locations.",
  pros: [
    "Global wellness and retreat demand supports differentiated villas",
    "Privacy, views, and larger land parcels can justify premium rates",
    "Less beach-driven seasonality than some coastal markets",
    "Strong fit for owner-use plus rental hybrid strategies",
  ],
  cons: [
    "Remote access can limit occupancy and increase management friction",
    "Moisture, maintenance, and jungle setting can raise operating costs",
    "Rates vary sharply by design quality and proximity to central Ubud",
    "Not every guest wants a long drive from beaches or airport access",
  ],
  priceBand: "$160k - $1.3M USD",
  nightlyBand: "$90 - $380 / night",
  matchLocations: ["Ubud"],
  neighbors: [
    { slug: "sanur", name: "Sanur" },
    { slug: "canggu", name: "Canggu" },
    { slug: "nusa-dua", name: "Nusa Dua" },
  ],
};

export const metadata: Metadata = {
  title: "Ubud Villa Investment ROI — Independent Yield Audits",
  description:
    "Independent Ubud villa investment audits. Compare stress-tested net yields, occupancy assumptions, management costs, lease decay, and red flags.",
  alternates: { canonical: "https://balivillatruth.com/ubud" },
  openGraph: {
    title: "Ubud Villa Investment ROI — Independent Yield Audits",
    description:
      "Net-yield analysis for Ubud villas, built for buyers who need conservative math before investing.",
    url: "https://balivillatruth.com/ubud",
  },
};

export const revalidate = 3600;

export default function UbudPage() {
  return <AreaPage cfg={cfg} />;
}
