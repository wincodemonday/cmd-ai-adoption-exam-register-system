import Link from "next/link";
import { cookies } from "next/headers";
import {
  REGISTRATION_SESSION_COOKIE,
  hasRegistrationAccess
} from "@/lib/auth";
import { getRegistrationByReference } from "@/lib/submissions";

export const dynamic = "force-dynamic";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function SubmissionPage({ params, searchParams }) {
  const { referenceCode } = await params;
  const query = (await searchParams) || {};
  const registration = getRegistrationByReference(referenceCode);
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(REGISTRATION_SESSION_COOKIE)?.value;
  const hasAccess = registration
    ? hasRegistrationAccess(sessionToken, registration.referenceCode)
    : false;

  if (!registration) {
    return (
      <section className="panel stack">
        <h2>Submission not found</h2>
        <p className="muted">
          This reference code does not exist. Please double-check it or submit a new
          registration.
        </p>
        <div className="actions">
          <Link href="/register" className="button linkish">
            Register now
          </Link>
          <Link href="/lookup" className="button secondary linkish">
            Try again
          </Link>
        </div>
      </section>
    );
  }

  if (!hasAccess) {
    return (
      <section className="panel stack">
        <div className="eyebrow">Locked submission</div>
        <h2>{registration.referenceCode}</h2>
        <p className="muted">
          Sign in with your reference code and password to view or edit this
          registration.
        </p>
        <div className="actions">
          <Link href="/lookup" className="button linkish">
            Go to submission lookup
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="page-grid">
      <section className="panel stack">
        <div className="stack">
          <div className="eyebrow">Reference code</div>
          <div className="code-pill">{registration.referenceCode}</div>
          <p className="muted">
            Created {formatDate(registration.createdAt)}. Last updated{" "}
            {formatDate(registration.updatedAt)}.
          </p>
        </div>

        {query.created ? <div className="notice success">{query.created}</div> : null}
        {query.success ? <div className="notice success">{query.success}</div> : null}
        {query.error ? <div className="notice error">{query.error}</div> : null}

        <form
          action={`/api/submissions/${registration.referenceCode}`}
          method="post"
          encType="multipart/form-data"
          className="stack"
        >
          <div className="field-grid">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" defaultValue={registration.name} required />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={registration.email}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" defaultValue={registration.phone} required />
            </div>
            <div className="field">
              <label htmlFor="company">Company</label>
              <input id="company" name="company" defaultValue={registration.company} />
            </div>
            <div className="field">
              <label htmlFor="jobTitle">Job title</label>
              <input id="jobTitle" name="jobTitle" defaultValue={registration.jobTitle} />
            </div>
            <div className="field">
              <label htmlFor="dietaryPreferences">Dietary preference</label>
              <input
                id="dietaryPreferences"
                name="dietaryPreferences"
                defaultValue={registration.dietaryPreferences}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" defaultValue={registration.notes} />
          </div>

          <div className="stack">
            <h3>Current documents</h3>
            {registration.documents.length === 0 ? (
              <div className="empty-state muted">No supporting documents uploaded yet.</div>
            ) : (
              <div className="docs-list">
                {registration.documents.map((document) => (
                  <div className="doc-item" key={document.id}>
                    <div className="stack">
                      <strong>{document.originalName}</strong>
                      <span className="muted">
                        {(document.size / 1024).toFixed(1)} KB
                      </span>
                      <a href={`/api/documents/${document.id}`}>Download current file</a>
                    </div>
                    <div className="field">
                      <span>Replace this document</span>
                      <input name={`replace_${document.id}`} type="file" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="newDocuments">Add more documents</label>
            <input id="newDocuments" name="newDocuments" type="file" multiple />
          </div>

          <div className="inline-actions">
            <button type="submit">Save changes</button>
          </div>
        </form>
      </section>

      <aside className="panel stack">
        <div className="info-card">
          <h3>Keep this code safe</h3>
          <p className="muted">
            You need both the reference code and your password to get back in later.
          </p>
        </div>
        <form action="/api/submissions/logout" method="post">
          <button type="submit" className="button secondary">
            Sign out from this submission
          </button>
        </form>
      </aside>
    </div>
  );
}
