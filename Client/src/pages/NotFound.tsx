import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight text-brand-charcoal">404</h1>
      <p className="mt-4 text-brand-muted">This page doesn't exist.</p>
      <Link
        to="/news"
        className="mt-8 inline-block rounded-pill border-2 border-brand-green px-5 py-2 text-sm font-semibold transition-colors hover:bg-brand-green hover:text-white"
      >
        Back to News
      </Link>
    </div>
  );
}
