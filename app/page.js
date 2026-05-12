import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="stack">
        <div className="eyebrow">Problem #4</div>
        <h1>Fast event registration with admin review and PDF tags.</h1>
        <p className="muted">
          One repo, one deployed app, public registration, submission lookup, admin
          dashboard, multi-file uploads, and name tag export.
        </p>
      </div>

      <div className="actions">
        <Link href="/register" className="button linkish">
          Start registration
        </Link>
        <Link href="/lookup" className="button secondary linkish">
          Return with reference code
        </Link>
      </div>

      <div className="hero-grid">
        <div className="hero-card">
          <h3>Public flow</h3>
          <p className="muted">
            Register, set a password, upload multiple documents, and get a reference
            code instantly.
          </p>
        </div>
        <div className="hero-card">
          <h3>Return and edit</h3>
          <p className="muted">
            Re-open the submission with reference code and password, edit fields,
            replace old files, and add new ones.
          </p>
        </div>
        <div className="hero-card">
          <h3>Admin review</h3>
          <p className="muted">
            Sign in from `.env`, inspect every submission, download supporting files,
            and export a name tag PDF.
          </p>
        </div>
      </div>
    </section>
  );
}
