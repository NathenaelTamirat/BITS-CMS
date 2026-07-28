import clsx from "clsx";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const buttonClass =
  "rounded-pill border-2 border-brand-green px-5 py-2 text-sm font-semibold text-brand-charcoal transition-colors hover:bg-brand-green hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-brand-charcoal";

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-12 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={clsx(buttonClass)}
      >
        Previous
      </button>
      <span className="px-2 text-sm text-brand-muted">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={clsx(buttonClass)}
      >
        Next
      </button>
    </nav>
  );
}
