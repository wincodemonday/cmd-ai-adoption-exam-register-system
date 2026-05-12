import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  cookieOptions,
  createAdminSession
} from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { buildRelativeUrl, createRedirectResponse } from "@/lib/request-url";

export const runtime = "nodejs";

function redirectWithMessage(pathname, key, message) {
  const url = new URL(buildRelativeUrl(pathname), "http://local");
  url.searchParams.set(key, message);
  return createRedirectResponse(`${url.pathname}${url.search}`);
}

export async function POST(request) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const env = getEnv();

  if (username !== env.adminUsername || password !== env.adminPassword) {
    return redirectWithMessage("/admin/login", "error", "Invalid credentials.");
  }

  const response = createRedirectResponse("/admin/registrations");
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    createAdminSession(env.adminUsername),
    cookieOptions()
  );
  return response;
}
