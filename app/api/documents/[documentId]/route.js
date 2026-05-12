import {
  ADMIN_SESSION_COOKIE,
  REGISTRATION_SESSION_COOKIE,
  hasAdminAccess,
  hasRegistrationAccess
} from "@/lib/auth";
import { readUploadedFile } from "@/lib/files";
import { getDocumentById } from "@/lib/submissions";

export const runtime = "nodejs";

function sanitizeFileName(value) {
  return String(value || "document").replace(/[^a-zA-Z0-9-_.]+/g, "-");
}

export async function GET(request, context) {
  const { documentId } = await context.params;
  const entry = await getDocumentById(documentId);

  if (!entry) {
    return new Response("Not found", { status: 404 });
  }

  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const registrationToken = request.cookies.get(REGISTRATION_SESSION_COOKIE)?.value;
  const isAuthorized =
    hasAdminAccess(adminToken) ||
    hasRegistrationAccess(registrationToken, entry.registration.referenceCode);

  if (!isAuthorized) {
    return new Response("Forbidden", { status: 403 });
  }

  const bytes = await readUploadedFile(entry.document.storageName);

  return new Response(bytes, {
    headers: {
      "content-type": entry.document.mimeType || "application/octet-stream",
      "content-disposition": `attachment; filename="${sanitizeFileName(entry.document.originalName)}"`
    }
  });
}
