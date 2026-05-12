import { NextResponse } from "next/server";
import { REGISTRATION_SESSION_COOKIE, cookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/lookup", request.url), {
    status: 303
  });
  response.cookies.set(REGISTRATION_SESSION_COOKIE, "", cookieOptions(0));
  return response;
}
