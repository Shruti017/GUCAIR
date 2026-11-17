import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import AuthNav from '@/components/AuthNav';

export const metadata: Metadata = {
  title: 'GUCAIR | Global University AI Readiness',
  description: 'A platform to assess, understand and advance AI readiness in higher education.'
};

const links = [
  ['Universities', '/universities'],
  ['Rankings', '/rankings'],
  ['Assessment', '/assessment'],
  ['Research', '/research'],
  ['Courses', '/courses'],
  ['Industry', '/industry'],
  ['Events', '/events']
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="nav-shell">
            <Link href="/" className="brand" aria-label="GUCAIR home">
              <span className="brand-mark">G</span>
              <span className="brand-copy">
                <strong>GUCAIR</strong>
                <small>GLOBAL AI READINESS</small>
              </span>
            </Link>
            <nav className="main-nav" aria-label="Main navigation">
              {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            </nav>
            <div className="nav-actions">
              <AuthNav />
            </div>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="footer-inner">
            <div className="brand footer-brand">
              <span className="brand-mark">G</span>
              <span className="brand-copy"><strong>GUCAIR</strong><small>GLOBAL AI READINESS</small></span>
            </div>
            <p>Building a clearer path towards AI-ready higher education.</p>
            <span>© {new Date().getFullYear()} GUCAIR</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
