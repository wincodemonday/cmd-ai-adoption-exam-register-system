import { NextResponse } from "next/server";
import {
  REGISTRATION_SESSION_COOKIE,
  cookieOptions,
  createRegistrationSession
} from "@/lib/auth";
import { authenticateRegistration } from "@/lib/submissions";

export const runtime = "nodejs";

function redirectWithMessage(request, pathname, key, message) {
  const url = new URL(pathname, request.url);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request) {
  const formData = await request.formData();
  const referenceCode = formData.get("referenceCode");
  const password = formData.get("password");
  const registration = await authenticateRegistration(referenceCode, password);

  if (!registration) {
    return redirectWithMessage(
      request,
      "/lookup",
      "error",
      "Reference code or password is incorrect."
    );
  }

  const response = NextResponse.redirect(
    new URL(`/submission/${registration.referenceCode}`, request.url),
    { status: 303 }
  );

  response.cookies.set(
    REGISTRATION_SESSION_COOKIE,
    createRegistrationSession(registration.referenceCode),
    cookieOptions()
  );

  return response;
}
