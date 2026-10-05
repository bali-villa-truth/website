import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "seminyak",
  name: "Seminyak",
  tagline: "Check condition, costs and the exact street",
  intro:
    "Seminyak, Kerobokan and Petitenget source labels cover different streets and property conditions. A central-sounding label does not establish a nightly rate, occupancy or renovation budget. Inspect the exact villa and request dated booking records, current operating bills and a professional condition report before relying on its modeled yield.",
  pros: [
    "Verify walking routes and street noise from the actual property",
    "Ask for dated bookings and payouts across a full year",
    "Check title claims and buyer eligibility with independent counsel",
    "Obtain written management quotes for this particular villa",
  ],
  cons: [
    "Compare asking price per measured land area only where size is verified",
    "Budget repairs from an independent survey, not a generic capex figure",
    "Check access, noise and neighboring construction at guest-use times",
    "Read the stated lease term and extension terms before modeling value",
  ],
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
    "Independent review of Seminyak-area villa listings. Examine modeled net yield, building condition, operating-cost assumptions and lease terms.",
  alternates: { canonical: "https://balivillatruth.com/seminyak" },
  openGraph: {
    title: "Seminyak Villa Investments — Audited ROI Analysis",
    description:
      "Seminyak-area listings with building-condition, lease and modeled-yield questions for buyers.",
    url: "https://balivillatruth.com/seminyak",
  },
};

export const revalidate = 3600;

export default function SeminyakPage() {
  return <AreaPage cfg={cfg} />;
}
