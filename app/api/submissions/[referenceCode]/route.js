import { NextResponse } from "next/server";
import {
  REGISTRATION_SESSION_COOKIE,
  hasRegistrationAccess
} from "@/lib/auth";
import {
  FormError,
  getRegistrationByReference,
  updateRegistration
} from "@/lib/submissions";

export const runtime = "nodejs";

function redirectWithMessage(request, pathname, key, message) {
  const url = new URL(pathname, request.url);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request, context) {
  const { referenceCode } = await context.params;
  const sessionToken = request.cookies.get(REGISTRATION_SESSION_COOKIE)?.value;

  if (!hasRegistrationAccess(sessionToken, referenceCode)) {
    return redirectWithMessage(
      request,
      "/lookup",
      "error",
      "Please sign in to your submission again."
    );
  }

  const currentRegistration = getRegistrationByReference(referenceCode);

  if (!currentRegistration) {
    return redirectWithMessage(request, "/lookup", "error", "Registration not found.");
  }

  const formData = await request.formData();
  const replacements = {};

  for (const document of currentRegistration.documents) {
    const file = formData.get(`replace_${document.id}`);

    if (file && file.size > 0) {
      replacements[String(document.id)] = file;
    }
  }

  try {
    await updateRegistration({
      referenceCode,
      fields: {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        company: formData.get("company"),
        jobTitle: formData.get("jobTitle"),
        dietaryPreferences: formData.get("dietaryPreferences"),
        notes: formData.get("notes")
      },
      newFiles: formData.getAll("newDocuments"),
      replacements
    });

    return redirectWithMessage(
      request,
      `/submission/${currentRegistration.referenceCode}`,
      "success",
      "Changes saved."
    );
  } catch (error) {
    const message =
      error instanceof FormError ? error.message : "Unable to update submission.";
    return redirectWithMessage(
      request,
      `/submission/${currentRegistration.referenceCode}`,
      "error",
      message
    );
  }
}
