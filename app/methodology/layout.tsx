import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Methodology — How We Calculate Bali Villa Net Yields",
  description:
    "Learn how Bali Villa Truth compares villa net yields using estimated nightly rates, a shared 65% occupancy scenario, 40% operating costs, and lease decay.",
  openGraph: {
    title: "Our Methodology — How We Calculate Bali Villa Net Yields",
    description:
      "The assumptions behind every yield: a shared 65% occupancy scenario, 40% operating costs, lease decay, and estimated nightly rates.",
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
