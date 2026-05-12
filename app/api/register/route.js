import { NextResponse } from "next/server";
import {
  REGISTRATION_SESSION_COOKIE,
  cookieOptions,
  createRegistrationSession
} from "@/lib/auth";
import { buildRelativeUrl, createRedirectResponse } from "@/lib/request-url";
import { createRegistration, FormError } from "@/lib/submissions";

export const runtime = "nodejs";

function redirectWithMessage(pathname, key, message) {
  const url = new URL(buildRelativeUrl(pathname), "http://local");
  url.searchParams.set(key, message);
  return createRedirectResponse(`${url.pathname}${url.search}`);
}

export async function POST(request) {
  const formData = await request.formData();

  try {
    const registration = await createRegistration({
      fields: {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        company: formData.get("company"),
        jobTitle: formData.get("jobTitle"),
        dietaryPreferences: formData.get("dietaryPreferences"),
        notes: formData.get("notes")
      },
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      files: formData.getAll("documents")
    });

    const response = redirectWithMessage(
      `/submission/${registration.referenceCode}`,
      "created",
      `Registration saved. Your reference code is ${registration.referenceCode}.`
    );

    response.cookies.set(
      REGISTRATION_SESSION_COOKIE,
      createRegistrationSession(registration.referenceCode),
      cookieOptions()
    );

    return response;
  } catch (error) {
    const message =
      error instanceof FormError ? error.message : "Unable to create registration.";
    return redirectWithMessage("/register", "error", message);
  }
}
