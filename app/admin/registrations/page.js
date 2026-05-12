import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, hasAdminAccess } from "@/lib/auth";
import { listRegistrations } from "@/lib/submissions";

export const dynamic = "force-dynamic";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminRegistrationsPage() {
  const cookieStore = await cookies();

  if (!hasAdminAccess(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/login?error=Please log in as admin.");
  }

  const registrations = await listRegistrations();

  return (
    <section className="panel stack">
      <div className="inline-actions" style={{ justifyContent: "space-between" }}>
        <div className="stat">
          <span className="muted">Registrations</span>
          <strong>{registrations.length}</strong>
        </div>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="button secondary">
            Sign out
          </button>
        </form>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state muted">No registrations have been submitted yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Name</th>
                <th>Email</th>
                <th>Documents</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr key={registration.id}>
                  <td>
                    <Link href={`/admin/registrations/${registration.id}`}>
                      {registration.referenceCode}
                    </Link>
                  </td>
                  <td>{registration.name}</td>
                  <td>{registration.email}</td>
                  <td>{registration.documents.length}</td>
                  <td>{formatDate(registration.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
