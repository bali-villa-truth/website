import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "seminyak",
  name: "Seminyak",
  tagline: "Mature market, yields under pressure",
  intro:
    "Seminyak was Bali's first tourism hotspot and it shows — mature infrastructure, established restaurants, and the most consistent year-round demand on the island. The flip side: prices per square meter are among the highest, older build stock needs capex, and gross yields rarely match Canggu once expenses are loaded. Our audit is particularly strict on renovation-needed listings and the often-optimistic nightly rates agents quote based on pre-2020 comps.",
  pros: [
    "Most consistent year-round occupancy of any Bali area we track",
    "Deep ecosystem — restaurants, spas, retail within walking distance",
    "Prime freehold plots still exist for serious buyers",
    "Rental agency competition keeps management fees below Canggu's",
  ],
  cons: [
    "Highest price-per-sqm on the island; yields suffer once you load expenses",
    "Aging build stock — many listings need $30-80k of capex in year one",
    "Traffic and congestion are real problems for premium renter appeal",
    "Leasehold remainders of 15 years are common; watch the depreciation",
  ],
  priceBand: "$350k – $2.5M USD",
  nightlyBand: "$150 – $500 / night",
  matchLocations: ["Seminyak", "Kerobokan", "Petitenget"],
  neighbors: [
    { slug: "canggu", name: "Canggu" },
    { slug: "uluwatu", name: "Uluwatu" },
    { slug: "sanur", name: "Sanur" },
  ],
};

export const metadata: Metadata = {
  title: "Seminyak Villa Investments — Audited ROI Analysis",
  description:
    "Independent ROI audit of Seminyak and Kerobokan villa investments. Net yields after the 40% expense load, lease depreciation, and red-flag detection on every audited Seminyak-area listing.",
  alternates: { canonical: "https://balivillatruth.com/seminyak" },
  openGraph: {
    title: "Seminyak Villa Investments — Audited ROI Analysis",
    description:
      "Mature-market Seminyak yields, audited without the brokerage spin.",
    url: "https://balivillatruth.com/seminyak",
  },
};

export const revalidate = 3600;

export default function SeminyakPage() {
  return <AreaPage cfg={cfg} />;
}
