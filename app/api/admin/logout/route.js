import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, cookieOptions } from "@/lib/auth";
import { createRedirectResponse } from "@/lib/request-url";

export const runtime = "nodejs";

export async function POST() {
  const response = createRedirectResponse("/admin/login");
  response.cookies.set(ADMIN_SESSION_COOKIE, "", cookieOptions(0));
  return response;
}
