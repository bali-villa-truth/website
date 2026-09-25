import crypto from "node:crypto";

// A high-entropy recovery credential is stored as a digest, never plaintext in public source.
const FALLBACK_PASSWORD_HASH = "d542743204b55f7178a40531c1373eabacf1fc6658aeb1486a00e8cc5bc6c015";
const COOKIE_NAME = "bvt_website_dashboard";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function passwordHash() {
  const configured = process.env.WEBSITE_DASHBOARD_PASSWORD;
  return configured
    ? crypto.createHash("sha256").update(configured).digest("hex")
    : FALLBACK_PASSWORD_HASH;
}

export function isWebsiteDashboardPassword(value: string) {
  const actual = crypto.createHash("sha256").update(value).digest();
  const expected = Buffer.from(passwordHash(), "hex");
  return crypto.timingSafeEqual(actual, expected);
}

export function isWebsiteDashboardToken(value?: string | null) {
  return Boolean(value) && isWebsiteDashboardPassword(value!);
}

export function websiteDashboardCookieOptions(password: string) {
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
