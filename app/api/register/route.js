import { NextResponse } from "next/server";
import {
  REGISTRATION_SESSION_COOKIE,
  cookieOptions,
  createRegistrationSession
} from "@/lib/auth";
import { createRegistration, FormError } from "@/lib/submissions";

export const runtime = "nodejs";

function redirectWithMessage(request, pathname, key, message) {
  const url = new URL(pathname, request.url);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, { status: 303 });
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
      request,
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
    return redirectWithMessage(request, "/register", "error", message);
  }
}
