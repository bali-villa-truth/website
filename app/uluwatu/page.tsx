import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "uluwatu",
  name: "Uluwatu",
  tagline: "Verify access, condition and the rate case",
  intro:
    "The Uluwatu source label can include nearby Bukit micro-locations, so confirm the actual address before drawing any income conclusion. Ask for dated property bookings and payouts, independent construction and land review, and written access and lease rights. BVT applies the same disclosed scenario here as elsewhere; it does not measure an Uluwatu occupancy average.",
  pros: [
    "Verify the advertised view and guest access in person",
    "Ask for this property's monthly bookings and payout statements",
    "Compare asking price with similar-size, similar-access villas",
    "Check whether furnishings and management contracts transfer to a buyer",
  ],
  cons: [
    "Test weaker months using actual booking history, not a fixed area rule",
    "For off-plan stock, verify approvals, milestones and completion evidence",
    "Confirm road and water access at the exact plot",
    "Use independent engineers and counsel for cliff, land and permit risks",
  ],
  matchLocations: ["Uluwatu", "Bingin", "Pecatu", "Nyang Nyang"],
  neighbors: [
    { slug: "ungasan", name: "Ungasan" },
    { slug: "canggu", name: "Canggu" },
    { slug: "sanur", name: "Sanur" },
  ],
};

export const metadata: Metadata = {
  title: "Uluwatu Villa Investments — Audited ROI Analysis",
  description:
    "Independent review of Uluwatu-area villa listings. Examine modeled net yield, off-plan evidence, land and access risks, and the shared occupancy assumption.",
  alternates: { canonical: "https://balivillatruth.com/uluwatu" },
  openGraph: {
    title: "Uluwatu Villa Investments — Audited ROI Analysis",
    description:
      "Uluwatu-area listings with exact-location, off-plan and modeled-occupancy questions for buyers.",
    url: "https://balivillatruth.com/uluwatu",
  },
};

export const revalidate = 3600;

export default function UluwatuPage() {
  return <AreaPage cfg={cfg} />;
}
