import {
  clearWebsiteDashboardCookieOptions,
  isWebsiteDashboardPassword,
  websiteDashboardCookieOptions,
} from "@/app/_lib/websiteDashboardAuth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!isWebsiteDashboardPassword(password)) {
    return Response.json(
      { ok: false, error: "Invalid password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(websiteDashboardCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearWebsiteDashboardCookieOptions());
  return response;
}
