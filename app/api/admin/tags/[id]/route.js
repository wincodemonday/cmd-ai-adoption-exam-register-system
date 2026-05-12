import { hasAdminAccess, ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { getRegistrationById } from "@/lib/submissions";
import { generateTagPdf } from "@/lib/pdf";

export const runtime = "nodejs";

function sanitizeFileName(value) {
  return String(value || "name-tag").replace(/[^a-zA-Z0-9-_]+/g, "-");
}

export async function GET(request, context) {
  const { id } = await context.params;
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!hasAdminAccess(sessionToken)) {
    return new Response("Forbidden", { status: 403 });
  }

  const registration = getRegistrationById(id);

  if (!registration) {
    return new Response("Not found", { status: 404 });
  }

  const pdf = await generateTagPdf(registration);
  const filename = `${sanitizeFileName(registration.referenceCode)}-tag.pdf`;

  return new Response(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`
    }
  });
}
