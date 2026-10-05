import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "nusa-dua",
  name: "Nusa Dua",
  tagline: "Separate villa evidence from resort comparisons",
  intro:
    "Nusa Dua and Tanjung Benoa source labels can include very different property types. A resort or hotel room is not an interchangeable comparable for a standalone villa. Check the exact property, rental permissions, like-for-like booked-night evidence, operating expenses and lease terms before using the shared BVT screening scenario.",
  pros: [
    "Confirm the villa's exact access, amenities and rental permissions",
    "Ask for property-level bookings rather than hotel or resort averages",
    "Compare properties with similar bedroom count and management model",
    "Check what maintenance and common-area fees the owner actually pays",
  ],
  cons: [
    "Reject hotel-room prices as direct evidence for villa nightly rates",
    "Test lower occupancy if the property has little booking history",
    "Verify any claimed resort access or beach rights in writing",
    "Have buyer-specific title and lease structures reviewed independently",
  ],
  matchLocations: ["Nusa Dua", "Tanjung Benoa"],
  neighbors: [
    { slug: "ungasan", name: "Ungasan" },
    { slug: "uluwatu", name: "Uluwatu" },
    { slug: "sanur", name: "Sanur" },
  ],
};

export const metadata: Metadata = {
  title: "Nusa Dua Villa Investment ROI — Independent Audits",
  description:
    "Review Nusa Dua-area villa asking listings. Separate hotel comparisons from villa evidence and inspect modeled yield, lease terms and operating-cost assumptions.",
  alternates: { canonical: "https://balivillatruth.com/nusa-dua" },
  openGraph: {
    title: "Nusa Dua Villa Investment ROI — Independent Audits",
    description:
      "Nusa Dua-area villa research with resort-comparable limits and lease questions made visible.",
    url: "https://balivillatruth.com/nusa-dua",
  },
};

export const revalidate = 3600;

export default function NusaDuaPage() {
  return <AreaPage cfg={cfg} />;
}
