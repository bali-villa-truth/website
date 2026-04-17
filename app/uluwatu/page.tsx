import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "uluwatu",
  name: "Uluwatu",
  tagline: "Cliff-edge luxury, cyclical demand",
  intro:
    "Uluwatu is Bali's luxury headline-maker — dramatic cliff villas, world-class surf, and the high-end resort crowd. Nightly rates regularly clear $500 at the top end, but demand is more seasonal than Canggu, and the build quality gap between developer villas is wide. Our audit pays special attention to off-plan risk, construction tier, and the sustainability of the numbers agents are quoting for the shoulder season.",
  pros: [
    "Top-end nightly rates in Bali — $400-$1000 for well-positioned luxury",
    "Strong brand and Instagram appeal — easier marketing, faster bookings",
    "Larger land plots available vs. Canggu — build-to-sell flips are viable",
    "Resort-anchor demand keeps premium inventory occupied in high season",
  ],
  cons: [
    "Seasonal occupancy — May-October is strong, low-season rates can halve",
    "Off-plan projects are common here; 'HIGH YIELD on a render' is our #1 flag",
    "Distance from Canggu & airport limits digital-nomad long-stay demand",
    "Water access and cliff-stability issues on some plots — site visits essential",
  ],
  priceBand: "$250k – $4M USD",
  nightlyBand: "$250 – $1000+ / night",
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
    "Independent ROI audit of Uluwatu villa investments. Cliff-edge luxury villa net yields, off-plan risk flags, and conservative occupancy analysis on Uluwatu, Bingin, and Pecatu listings.",
  alternates: { canonical: "https://balivillatruth.com/uluwatu" },
  openGraph: {
    title: "Uluwatu Villa Investments — Audited ROI Analysis",
    description:
      "Cliff-edge luxury, audited honestly. Net yields, off-plan flags, conservative occupancy.",
    url: "https://balivillatruth.com/uluwatu",
  },
};

export const revalidate = 3600;

export default function UluwatuPage() {
  return <AreaPage cfg={cfg} />;
}
