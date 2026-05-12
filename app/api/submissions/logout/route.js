import { NextResponse } from "next/server";
import { REGISTRATION_SESSION_COOKIE, cookieOptions } from "@/lib/auth";
import { createRedirectResponse } from "@/lib/request-url";

export const runtime = "nodejs";

export async function POST() {
  const response = createRedirectResponse("/lookup");
  response.cookies.set(REGISTRATION_SESSION_COOKIE, "", cookieOptions(0));
  return response;
}
