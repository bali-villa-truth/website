import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  isWebsiteDashboardToken,
} from "@/app/_lib/websiteDashboardAuth";
import WebsiteDashboardClient from "./WebsiteDashboardClient";
import WebsiteDashboardLogin from "./WebsiteDashboardLogin";

export const metadata: Metadata = {
  title: "BVT Website Optimization Dashboard",
  description:
    "Private internal dashboard for Bali Villa Truth website improvements, blockers, live checks, and next actions.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://balivillatruth.com/website-dashboard",
  },
};

export const dynamic = "force-dynamic";

export default async function WebsiteDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!isWebsiteDashboardToken(token)) {
    return <WebsiteDashboardLogin />;
  }

  return <WebsiteDashboardClient />;
}
