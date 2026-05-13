import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE_NAME, isDashboardToken } from "@/app/_lib/seoDashboardAuth";
import SeoDashboardClient from "./SeoDashboardClient";
import SeoDashboardLogin from "./SeoDashboardLogin";

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

export default async function SeoDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!isDashboardToken(token)) {
    return <SeoDashboardLogin />;
  }

  return <SeoDashboardClient />;
}
