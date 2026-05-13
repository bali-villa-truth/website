import type { Metadata } from "next";
import SeoDashboardClient from "./SeoDashboardClient";

export const metadata: Metadata = {
  title: "BVT SEO Dashboard",
  description:
    "Live internal dashboard for Bali Villa Truth SEO progress, keyword visibility, scheduled jobs, and indexing status.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://balivillatruth.com/seo-dashboard",
  },
};

export const dynamic = "force-dynamic";

export default function SeoDashboardPage() {
  return <SeoDashboardClient />;
}
