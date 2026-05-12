import { NextResponse } from "next/server";
import {
  REGISTRATION_SESSION_COOKIE,
  cookieOptions,
  createRegistrationSession
} from "@/lib/auth";
import { buildRelativeUrl, createRedirectResponse } from "@/lib/request-url";
import { authenticateRegistration } from "@/lib/submissions";

export const runtime = "nodejs";

function redirectWithMessage(pathname, key, message) {
  const url = new URL(buildRelativeUrl(pathname), "http://local");
  url.searchParams.set(key, message);
  return createRedirectResponse(`${url.pathname}${url.search}`);
}

export async function POST(request) {
  const formData = await request.formData();
  const referenceCode = formData.get("referenceCode");
  const password = formData.get("password");
  const registration = await authenticateRegistration(referenceCode, password);

  if (!registration) {
    return redirectWithMessage(
      "/lookup",
      "error",
      "Reference code or password is incorrect."
    );
  }

  const response = createRedirectResponse(`/submission/${registration.referenceCode}`);

  response.cookies.set(
    REGISTRATION_SESSION_COOKIE,
    createRegistrationSession(registration.referenceCode),
    cookieOptions()
  );

  return response;
}
