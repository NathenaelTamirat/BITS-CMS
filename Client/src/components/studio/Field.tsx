import clsx from "clsx";
import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}

export default function Field({
  label,
  hint,
  error,
  children,
  required,
}: FieldProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-brand-charcoal">
        {label}
        {required && <span className="ml-0.5 text-brand-green">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && !error && (
        <span className="mt-1 block text-xs text-brand-muted">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

export const inputClass =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-brand-charcoal placeholder-brand-muted shadow-sm transition-colors focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green";

export function inputCls(extra?: string) {
  return clsx(inputClass, extra);
}
