import {
  clearDashboardCookieOptions,
  dashboardCookieOptions,
  isDashboardPassword,
} from "@/app/_lib/seoDashboardAuth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!isDashboardPassword(password)) {
    return Response.json(
      { ok: false, error: "Invalid password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(dashboardCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearDashboardCookieOptions());
  return response;
}
