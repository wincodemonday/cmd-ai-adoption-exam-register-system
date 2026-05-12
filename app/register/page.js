function readSearch(searchParams) {
  return searchParams || {};
}

export default async function RegisterPage({ searchParams }) {
  const query = readSearch(await searchParams);

  return (
    <div className="page-grid">
      <section className="panel stack">
        <div className="stack">
          <div className="eyebrow">Attendee registration</div>
          <h2>Submit your event registration</h2>
          <p className="muted">
            Fill in your details, upload supporting files, and create a password for
            returning later.
          </p>
        </div>

        {query.error ? <div className="notice error">{query.error}</div> : null}

        <form
          action="/api/register"
          method="post"
          encType="multipart/form-data"
          className="stack"
        >
          <div className="field-grid">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" required />
            </div>
            <div className="field">
              <label htmlFor="company">Company</label>
              <input id="company" name="company" />
            </div>
            <div className="field">
              <label htmlFor="jobTitle">Job title</label>
              <input id="jobTitle" name="jobTitle" />
            </div>
            <div className="field">
              <label htmlFor="dietaryPreferences">Dietary preference</label>
              <input id="dietaryPreferences" name="dietaryPreferences" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Accessibility, parking, arrival window, or anything the event team should know"
            />
          </div>

          <div className="field">
            <label htmlFor="documents">Supporting documents</label>
            <input id="documents" name="documents" type="file" multiple />
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" minLength="8" required />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength="8"
                required
              />
            </div>
          </div>

          <div className="inline-actions">
            <button type="submit">Create registration</button>
          </div>
        </form>
      </section>

      <aside className="panel stack">
        <div className="info-card">
          <h3>What you get</h3>
          <p className="muted">
            After submission the system generates a reference code that works with your
            password to reopen and edit the registration.
          </p>
        </div>
        <div className="info-card">
          <h3>Supported return flow</h3>
          <p className="muted">
            You can replace any existing document and add extra files later from the
            submission page.
          </p>
        </div>
      </aside>
    </div>
  );
}
