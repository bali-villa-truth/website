import type { Metadata } from "next";
import AreaPage, { AreaConfig } from "@/app/_lib/AreaPage";

const cfg: AreaConfig = {
  slug: "pererenan",
  name: "Pererenan",
  tagline: "Test the address behind the Canggu comparison",
  intro:
    "Pererenan and Seseh appear as source location labels on this page. Neither label proves the precise address, guest access or achievable rental income. BVT's shared scenario helps compare asking prices, but the investment case needs property-level booking evidence, operating bills and a verified lease.",
  pros: [
    "Confirm the exact street, beach route and vehicle access",
    "Ask for dated guest bookings and owner payouts",
    "Compare asking prices with similar villas, not a nearby area's name",
    "Check the inclusions and condition of any design-led fit-out",
  ],
  cons: [
    "Inspect nearby construction and permits before pricing a quiet setting",
    "Exclude hoped-for appreciation from the current net-yield estimate",
    "Visit the access road at different times rather than using a map alone",
    "Verify extension rights and pricing before modeling an exit",
  ],
  matchLocations: ["Pererenan", "Seseh"],
  neighbors: [
    { slug: "canggu", name: "Canggu" },
    { slug: "berawa", name: "Berawa" },
    { slug: "uluwatu", name: "Uluwatu" },
  ],
};

export const metadata: Metadata = {
  title: "Pererenan Villa Investment ROI — Net Yield Audits",
  description:
    "Review Pererenan and Seseh source listings. Compare modeled yield assumptions, lease terms and property evidence without treating area labels as verified addresses.",
  alternates: { canonical: "https://balivillatruth.com/pererenan" },
  openGraph: {
    title: "Pererenan Villa Investment ROI — Net Yield Audits",
    description:
      "Pererenan-area villa research with source-location and modeled-yield assumptions visible.",
    url: "https://balivillatruth.com/pererenan",
  },
};

export const revalidate = 3600;

export default function PererenanPage() {
  return <AreaPage cfg={cfg} />;
}
