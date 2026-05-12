import Link from "next/link";
import "@/app/globals.css";

export const metadata = {
  title: "Event Register System",
  description: "CMD AI Adoption Exam 2026 problem 4 solution"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <Link href="/" className="brand">
              Event Register System
            </Link>
            <nav className="nav-links">
              <Link href="/register">Register</Link>
              <Link href="/lookup">My Submission</Link>
              <Link href="/admin/login">Admin</Link>
            </nav>
          </header>
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
