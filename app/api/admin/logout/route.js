import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, cookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303
  });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", cookieOptions(0));
  return response;
}
