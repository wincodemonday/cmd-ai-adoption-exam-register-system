import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, hasAdminAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }) {
  const query = (await searchParams) || {};
  const cookieStore = await cookies();

  if (hasAdminAccess(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/registrations");
  }

  return (
    <div className="page-grid">
      <section className="panel stack">
        <div className="stack">
          <div className="eyebrow">Admin login</div>
          <h2>Access the registration dashboard</h2>
          <p className="muted">
            Credentials are loaded from `.env`, keeping the admin flow inside the same
            project.
          </p>
        </div>

        {query.error ? <div className="notice error">{query.error}</div> : null}

        <form action="/api/admin/login" method="post" className="stack">
          <div className="field-grid">
            <div className="field">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required />
            </div>
          </div>

          <div className="inline-actions">
            <button type="submit">Sign in</button>
          </div>
        </form>
      </section>

      <aside className="panel stack">
        <div className="info-card">
          <h3>Admin actions</h3>
          <p className="muted">
            View every registration, inspect uploaded files, and download PDF name tags.
          </p>
        </div>
      </aside>
    </div>
  );
}
