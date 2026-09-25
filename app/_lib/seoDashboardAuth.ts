import crypto from "node:crypto";

// A high-entropy recovery credential is stored as a digest, never plaintext in public source.
const FALLBACK_PASSWORD_HASH = "3779463c1e9a6a1b53ddf982666acdc1f05aab59d5327727ca4b273f239cbe8c";
const COOKIE_NAME = "bvt_seo_dashboard";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function passwordHash() {
  const configured = process.env.SEO_DASHBOARD_PASSWORD;
  return configured
    ? crypto.createHash("sha256").update(configured).digest("hex")
    : FALLBACK_PASSWORD_HASH;
}

export function isDashboardPassword(value: string) {
  const actual = crypto.createHash("sha256").update(value).digest();
  const expected = Buffer.from(passwordHash(), "hex");
  return crypto.timingSafeEqual(actual, expected);
}

export function isDashboardToken(value?: string | null) {
  return Boolean(value) && isDashboardPassword(value!);
}

export function dashboardCookieOptions(password: string) {
  return {
    name: COOKIE_NAME,
    value: password,
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
