import crypto from "node:crypto";

const FALLBACK_PASSWORD = "BVT-SEO-2026!";
const COOKIE_NAME = "bvt_seo_dashboard";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function dashboardPassword() {
  return process.env.SEO_DASHBOARD_PASSWORD || FALLBACK_PASSWORD;
}

export function expectedDashboardToken() {
  return crypto
    .createHash("sha256")
    .update(`bvt-seo-dashboard:${dashboardPassword()}`)
    .digest("hex");
}

export function isDashboardPassword(value: string) {
  return value === dashboardPassword();
}

export function isDashboardToken(value?: string | null) {
  return Boolean(value) && value === expectedDashboardToken();
}

export function dashboardCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: expectedDashboardToken(),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export function clearDashboardCookieOptions() {
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
