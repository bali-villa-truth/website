import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Methodology — How We Calculate Bali Villa Net Yields",
  description:
    "Every assumption behind every number on Bali Villa Truth. Learn how we calculate net yields using 40% expense loads, area-specific occupancy rates, lease decay, and market-rate benchmarks from 2,000+ Bali villa listings.",
  openGraph: {
    title: "Our Methodology — How We Calculate Bali Villa Net Yields",
    description:
      "Every assumption behind every number. 40% expense load, area-specific occupancy, lease decay analysis, and market-rate benchmarks across 2,000+ listings.",
    url: "https://balivillatruth.com/methodology",
  },
  alternates: {
    canonical: "https://balivillatruth.com/methodology",
  },
};

export default function MethodologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
