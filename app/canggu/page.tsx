import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "canggu",
  name: "Canggu",
  tagline: "Compare the property, not the area story",
  intro:
    "This source-area page groups Canggu with nearby labels such as Berawa and Pererenan. Those labels are useful for browsing, not proof of street-level demand or a verified address. Compare asking prices, lease documents, dated property bookings and actual operating costs before relying on a modeled yield.",
  pros: [
    "Confirm the map pin and property access rather than relying on the area tag",
    "Request month-by-month booked nights and payout records",
    "Compare management offers using written fee and service schedules",
    "Check the proposed buyer structure and lease with independent counsel",
  ],
  cons: [
    "Test whether new nearby supply changes the property's booking case",
    "Inspect traffic, drainage, noise and construction at the exact address",
    "Verify the remaining lease years and priced extension terms",
    "Check the downside case before accepting a brochure ROI or resale claim",
  ],
  matchLocations: ["Canggu", "Berawa", "Pererenan", "Echo Beach"],
  neighbors: [
    { slug: "seminyak", name: "Seminyak" },
    { slug: "uluwatu", name: "Uluwatu" },
    { slug: "sanur", name: "Sanur" },
  ],
};

export const metadata: Metadata = {
  title: "Canggu Villa Investments — Audited ROI Analysis",
  description:
    "Browse Canggu-area source listings, including neighboring labels. Check modeled yield eligibility, lease terms, operating-cost assumptions and exact location.",
  alternates: { canonical: "https://balivillatruth.com/canggu" },
  openGraph: {
    title: "Canggu Villa Investments — Audited ROI Analysis",
    description:
      "Canggu-area listing research with modeled yield and source-location limits made clear.",
    url: "https://balivillatruth.com/canggu",
  },
};

export const revalidate = 3600;

export default function CangguPage() {
  return <AreaPage cfg={cfg} />;
}
