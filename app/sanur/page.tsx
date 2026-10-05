import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "sanur",
  name: "Sanur",
  tagline: "Check the long-stay case property by property",
  intro:
    "This source-area page includes Sanur, Denpasar and Renon labels, which should not be treated as one rental market. If a seller pitches long stays or stable occupancy, request the property's dated bookings, stay lengths, payouts and actual management costs. Check the address, building condition and permitted rental use before comparing net-yield scenarios.",
  pros: [
    "Check the actual mix of nightly and longer stays in owner records",
    "Compare asking prices only with similar-size and similar-condition villas",
    "Confirm guest access and travel times at the exact address",
    "Request the current management, cleaning and booking fee schedule",
  ],
  cons: [
    "Do not infer an area occupancy or rate from a few long-stay examples",
    "Treat resale speed as unknown without comparable completed sales",
    "Commission an independent building and maintenance review",
    "Verify the buyer profile with property records, not lifestyle assumptions",
  ],
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
    "Independent review of Sanur-area villa listings. Compare modeled net yield, lease terms and long-stay claims against property-level evidence.",
  alternates: { canonical: "https://balivillatruth.com/sanur" },
  openGraph: {
    title: "Sanur Villa Investments — Audited ROI Analysis",
    description:
      "Sanur-area villa asking prices and modeled yields, with long-stay claims to verify.",
    url: "https://balivillatruth.com/sanur",
  },
};

export const revalidate = 3600;

export default function SanurPage() {
  return <AreaPage cfg={cfg} />;
}
