import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "ungasan",
  name: "Ungasan",
  tagline: "Check the build and the source location label",
  intro:
    "This page draws from Ungasan, Pecatu and Jimbaran source labels, which can refer to distinct plots and buyer propositions. Do not infer an Ungasan address or rental premium from the grouping. For each villa, verify the site, construction stage, title, utility access and property-level income evidence before relying on a developer yield claim.",
  pros: [
    "Confirm the actual land and built areas from plans and a site visit",
    "Inspect the usable outdoor space and guest access",
    "Request bookings and payouts for completed comparable villas",
    "Compare management quotes with the same inclusions and service level",
  ],
  cons: [
    "For off-plan assets, verify permits, build milestones and deposit protections",
    "Do not import an Uluwatu nightly rate without like-for-like property evidence",
    "Check water, road and utility capacity at the exact plot",
    "Treat exit value as uncertain without comparable completed sales",
  ],
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
    "Review Ungasan-area source listings with off-plan, address and modeled-yield assumptions clearly labeled. Verify property-level income and build evidence.",
  alternates: { canonical: "https://balivillatruth.com/ungasan" },
  openGraph: {
    title: "Ungasan Villa Investments — Audited ROI Analysis",
    description:
      "Ungasan-area villa research with off-plan evidence, exact-location and modeled-yield questions.",
    url: "https://balivillatruth.com/ungasan",
  },
};

export const revalidate = 3600;

export default function UngasanPage() {
  return <AreaPage cfg={cfg} />;
}
