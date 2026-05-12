import { NextResponse } from "next/server";
import {
  REGISTRATION_SESSION_COOKIE,
  hasRegistrationAccess
} from "@/lib/auth";
import { buildRelativeUrl, createRedirectResponse } from "@/lib/request-url";
import {
  FormError,
  getRegistrationByReference,
  updateRegistration
} from "@/lib/submissions";

export const runtime = "nodejs";

function redirectWithMessage(pathname, key, message) {
  const url = new URL(buildRelativeUrl(pathname), "http://local");
  url.searchParams.set(key, message);
  return createRedirectResponse(`${url.pathname}${url.search}`);
}

export async function POST(request, context) {
  const { referenceCode } = await context.params;
  const sessionToken = request.cookies.get(REGISTRATION_SESSION_COOKIE)?.value;

  if (!hasRegistrationAccess(sessionToken, referenceCode)) {
    return redirectWithMessage(
      "/lookup",
      "error",
      "Please sign in to your submission again."
    );
  }

  const currentRegistration = await getRegistrationByReference(referenceCode);

  if (!currentRegistration) {
    return redirectWithMessage("/lookup", "error", "Registration not found.");
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
      `/submission/${currentRegistration.referenceCode}`,
      "success",
      "Changes saved."
    );
  } catch (error) {
    const message =
      error instanceof FormError ? error.message : "Unable to update submission.";
    return redirectWithMessage(
      `/submission/${currentRegistration.referenceCode}`,
      "error",
      message
    );
  }
}
