export default async function LookupPage({ searchParams }) {
  const query = (await searchParams) || {};

  return (
    <div className="page-grid">
      <section className="panel stack">
        <div className="stack">
          <div className="eyebrow">Return later</div>
          <h2>Open your saved submission</h2>
          <p className="muted">
            Use the reference code from your original registration plus the password you
            set at submission time.
          </p>
        </div>

        {query.error ? <div className="notice error">{query.error}</div> : null}

        <form action="/api/submissions/lookup" method="post" className="stack">
          <div className="field-grid">
            <div className="field">
              <label htmlFor="referenceCode">Reference code</label>
              <input id="referenceCode" name="referenceCode" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required />
            </div>
          </div>

          <div className="inline-actions">
            <button type="submit">Open submission</button>
          </div>
        </form>
      </section>

      <aside className="panel stack">
        <div className="info-card">
          <h3>Reference code format</h3>
          <p className="muted">
            The code looks like `EVT-XXXXXXXX` and is shown immediately after successful
            registration.
          </p>
        </div>
      </aside>
    </div>
  );
}
