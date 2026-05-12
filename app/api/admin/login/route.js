import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  cookieOptions,
  createAdminSession
} from "@/lib/auth";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

function redirectWithMessage(request, pathname, key, message) {
  const url = new URL(pathname, request.url);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const env = getEnv();

  if (username !== env.adminUsername || password !== env.adminPassword) {
    return redirectWithMessage(request, "/admin/login", "error", "Invalid credentials.");
  }

  const response = NextResponse.redirect(new URL("/admin/registrations", request.url), {
    status: 303
  });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    createAdminSession(env.adminUsername),
    cookieOptions()
  );
  return response;
}
