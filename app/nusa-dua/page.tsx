import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "nusa-dua",
  name: "Nusa Dua",
  tagline: "Resort demand, lower chaos, careful rate comps",
  intro:
    "Nusa Dua is a different investment profile from Canggu or Uluwatu: more resort infrastructure, calmer streets, family demand, and a guest base that often compares villas against branded hotels. The area can support stable rental performance, but public platform comps can be distorted by resorts and large managed estates. Our Nusa Dua audits discount that noise by applying a standardized model across asking price, nightly rate, occupancy, expenses, and lease term.",
  pros: [
    "Family and resort-adjacent demand can support steadier occupancy",
    "Better infrastructure and calmer roads than many west-coast markets",
    "Appeals to guests who value beaches, golf, and gated-resort amenities",
    "Potentially less operational chaos than Canggu-style nightlife markets",
  ],
  cons: [
    "Hotel and resort comps can inflate assumed nightly rates",
    "Some submarkets have thinner independent villa demand",
    "Lower nightlife demand can reduce peak-season upside",
    "Freehold and lease structures need careful buyer-specific legal review",
  ],
  priceBand: "$170k - $1.5M USD",
  nightlyBand: "$100 - $420 / night",
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
    "Independent Nusa Dua villa investment audits. Stress-tested net yields, resort-comp risk, lease depreciation, management costs, and red flags.",
  alternates: { canonical: "https://balivillatruth.com/nusa-dua" },
  openGraph: {
    title: "Nusa Dua Villa Investment ROI — Independent Audits",
    description:
      "Conservative net-yield audits for Nusa Dua villas, with resort-comp noise and lease risk made visible.",
    url: "https://balivillatruth.com/nusa-dua",
  },
};

export const revalidate = 3600;

export default function NusaDuaPage() {
  return <AreaPage cfg={cfg} />;
}
