import crypto from "node:crypto";

const FALLBACK_PASSWORD = "BVT-WEBSITE-2026!";
const COOKIE_NAME = "bvt_website_dashboard";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function dashboardPassword() {
  return process.env.WEBSITE_DASHBOARD_PASSWORD || FALLBACK_PASSWORD;
}

export function expectedWebsiteDashboardToken() {
  return crypto
    .createHash("sha256")
    .update(`bvt-website-dashboard:${dashboardPassword()}`)
    .digest("hex");
}

export function isWebsiteDashboardPassword(value: string) {
  return value === dashboardPassword();
}

export function isWebsiteDashboardToken(value?: string | null) {
  return Boolean(value) && value === expectedWebsiteDashboardToken();
}

export function websiteDashboardCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: expectedWebsiteDashboardToken(),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export function clearWebsiteDashboardCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: 0,
  };
}

export { COOKIE_NAME };
