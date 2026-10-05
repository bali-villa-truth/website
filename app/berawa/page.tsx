import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "berawa",
  name: "Berawa",
  tagline: "Check the premium, not the postcode",
  intro:
    "The source groups Berawa-area properties under a broader Canggu label. A match here does not establish a Berawa address or a rental premium. Verify the map pin, dated property-level bookings and payouts, operating bills, and the remaining lease before treating a seller's asking price as an income case.",
  pros: [
    "Confirm the exact address, access and walkability on site",
    "Request property-level booked nights and guest payouts by month",
    "Compare independent management quotes and included services",
    "Check what the asking price includes, including furnishings and transfer costs",
  ],
  cons: [
    "Test a lower occupancy and rate case against the asking price",
    "Inspect traffic, construction noise and neighboring permits at the property",
    "Read the signed lease and extension-price terms with independent counsel",
    "Treat developer revenue projections as unverified until backed by records",
  ],
  // BHI stores Berawa-area listings under the broader "Canggu" label.
  matchLocations: ["Canggu"],
  neighbors: [
    { slug: "canggu", name: "Canggu" },
    { slug: "pererenan", name: "Pererenan" },
    { slug: "seminyak", name: "Seminyak" },
  ],
};

export const metadata: Metadata = {
  title: "Berawa Villa Investment ROI — Independent Audits",
  description:
    "Review Canggu-labeled source listings that may be in Berawa. Verify the exact address, modeled yield assumptions, costs and lease terms before buying.",
  alternates: { canonical: "https://balivillatruth.com/berawa" },
  openGraph: {
    title: "Berawa Villa Investment ROI — Independent Audits",
    description:
      "Berawa-area listing research with source-label limits and modeled yield assumptions made visible.",
    url: "https://balivillatruth.com/berawa",
  },
};

export const revalidate = 3600;

export default function BerawaPage() {
  return <AreaPage cfg={cfg} />;
}
