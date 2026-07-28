import { Link, NavLink, Outlet } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/news" },
  { label: "About", to: "#" },
  { label: "Academics", to: "#" },
  { label: "Admissions", to: "#" },
  { label: "Services", to: "#" },
  { label: "News & Events", to: "/news" },
];

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/news" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-brand-charcoal">
              Bi<span className="text-brand-green">T</span>S
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive && l.to !== "#"
                      ? "text-brand-green"
                      : "text-brand-charcoal hover:text-brand-green"
                  }`
                }
                end={l.to === "/news"}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <a
            href="#"
            className="rounded-pill border-2 border-brand-green px-5 py-2 text-sm font-semibold text-brand-charcoal transition-colors hover:bg-brand-green hover:text-white"
          >
            Apply Now
          </a>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-brand-charcoal text-gray-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
          <div>
            <div className="mb-3 text-2xl font-extrabold text-white">
              Bi<span className="text-brand-green">T</span>S
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              From collecting to connecting.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
              Contact
            </h4>
            <ul className="space-y-2 text-sm">
              <li>info@bitscollege.edu.et</li>
              <li>+251 11 000 0000</li>
              <li>Addis Ababa, Ethiopia</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Tuition</li>
              <li>Admissions</li>
              <li>Accreditations</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
              Follow
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Facebook</li>
              <li>Twitter</li>
              <li>Instagram</li>
              <li>YouTube</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} BITS College. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
