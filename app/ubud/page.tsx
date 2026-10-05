import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "ubud",
  name: "Ubud",
  tagline: "Access and upkeep change the property case",
  intro:
    "An Ubud label alone says little about the road, building condition or rental history of a specific villa. Compare the exact access, maintenance needs and property-level guest records before accepting a view or wellness premium. BVT's shared model is a screening comparison, not an Ubud occupancy estimate.",
  pros: [
    "Confirm advertised views, privacy and access on site",
    "Request property bookings and payouts rather than an area rate claim",
    "Compare land area and build condition using measured documents",
    "If planning owner use, model blocked nights separately from rentals",
  ],
  cons: [
    "Check vehicle access, travel times and emergency access at the plot",
    "Inspect moisture, drainage and maintenance with a qualified professional",
    "Test a lower rate against similar-condition property evidence",
    "Verify whether management quotes cover transport and remote servicing",
  ],
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
    "Review Ubud villa asking listings with modeled net yield, shared occupancy assumptions, access, maintenance and lease questions clearly separated.",
  alternates: { canonical: "https://balivillatruth.com/ubud" },
  openGraph: {
    title: "Ubud Villa Investment ROI — Independent Yield Audits",
    description:
      "Ubud villa research with access, maintenance and modeled-yield assumptions to verify.",
    url: "https://balivillatruth.com/ubud",
  },
};

export const revalidate = 3600;

export default function UbudPage() {
  return <AreaPage cfg={cfg} />;
}
