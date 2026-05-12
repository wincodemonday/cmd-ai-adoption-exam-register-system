import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, hasAdminAccess } from "@/lib/auth";
import { getRegistrationById } from "@/lib/submissions";

export const dynamic = "force-dynamic";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminRegistrationDetailPage({ params }) {
  const { id } = await params;
  const cookieStore = await cookies();

  if (!hasAdminAccess(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/login?error=Please log in as admin.");
  }

  const registration = getRegistrationById(id);

  if (!registration) {
    return (
      <section className="panel stack">
        <h2>Registration not found</h2>
        <Link href="/admin/registrations" className="button secondary linkish">
          Back to list
        </Link>
      </section>
    );
  }

  return (
    <div className="page-grid">
      <section className="panel stack">
        <div className="stack">
          <div className="eyebrow">Registration detail</div>
          <h2>{registration.name}</h2>
          <div className="code-pill">{registration.referenceCode}</div>
        </div>

        <div className="detail-list">
          <div className="list-item">
            <strong>Email</strong>
            <span>{registration.email}</span>
          </div>
          <div className="list-item">
            <strong>Phone</strong>
            <span>{registration.phone}</span>
          </div>
          <div className="list-item">
            <strong>Company</strong>
            <span>{registration.company || "-"}</span>
          </div>
          <div className="list-item">
            <strong>Job title</strong>
            <span>{registration.jobTitle || "-"}</span>
          </div>
          <div className="list-item">
            <strong>Dietary preference</strong>
            <span>{registration.dietaryPreferences || "-"}</span>
          </div>
          <div className="list-item">
            <strong>Notes</strong>
            <span>{registration.notes || "-"}</span>
          </div>
          <div className="list-item">
            <strong>Created</strong>
            <span>{formatDate(registration.createdAt)}</span>
          </div>
          <div className="list-item">
            <strong>Updated</strong>
            <span>{formatDate(registration.updatedAt)}</span>
          </div>
        </div>

        <div className="stack">
          <h3>Documents</h3>
          {registration.documents.length === 0 ? (
            <div className="empty-state muted">No uploaded documents.</div>
          ) : (
            <div className="docs-list">
              {registration.documents.map((document) => (
                <div className="doc-item" key={document.id}>
                  <div className="stack">
                    <strong>{document.originalName}</strong>
                    <span className="muted">
                      {(document.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <a href={`/api/documents/${document.id}`}>Download file</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="panel stack">
        <Link href="/admin/registrations" className="button secondary linkish">
          Back to registrations
        </Link>
        <a href={`/api/admin/tags/${registration.id}`} className="button linkish">
          Download name tag PDF
        </a>
      </aside>
    </div>
  );
}
