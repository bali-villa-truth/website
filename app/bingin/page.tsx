import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "bingin",
  name: "Bingin",
  tagline: "Exact access matters more than the area label",
  intro:
    "The source files potential Bingin-area villas under broader Bukit labels, so this page is a discovery list rather than a verified Bingin boundary. Before underwriting a property, confirm the exact address, road and stair access, title and building permissions, and property-level rental records. A view or design premium needs evidence in the actual asking price and bookings.",
  pros: [
    "Verify the advertised view, access and guest route in person",
    "Ask for dated booking and payout records for this property",
    "Compare the villa with similar-size, similar-access rentals",
    "Check whether design features are included in the asking price",
  ],
  cons: [
    "Confirm vehicle access, parking, stairs and noise at the exact plot",
    "Have independent advisers review land, cliff and building permissions",
    "Treat thin comparable samples as uncertain, not a market average",
    "Stress-test the asking-price premium against lower bookings and higher costs",
  ],
  // BHI stores Bingin-area inventory under broader Bukit labels.
  matchLocations: ["Uluwatu", "Ungasan", "Pandawa"],
  neighbors: [
    { slug: "uluwatu", name: "Uluwatu" },
    { slug: "ungasan", name: "Ungasan" },
    { slug: "nusa-dua", name: "Nusa Dua" },
  ],
};

export const metadata: Metadata = {
  title: "Bingin Villa Investment ROI — Independent Net Yield Audits",
  description:
    "Review broader Bukit-labeled source listings that may be near Bingin. Check exact access, land rights, modeled yield assumptions and property-level bookings.",
  alternates: { canonical: "https://balivillatruth.com/bingin" },
  openGraph: {
    title: "Bingin Villa Investment ROI — Independent Net Yield Audits",
    description:
      "Bingin-area villa research with address, access, lease and modeled-yield questions made visible.",
    url: "https://balivillatruth.com/bingin",
  },
};

export const revalidate = 3600;

export default function BinginPage() {
  return <AreaPage cfg={cfg} />;
}
