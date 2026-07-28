import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import clsx from "clsx";
import { formatDate } from "@/lib/format";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function parseYMD(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = parseYMD(value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const id = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    onChange(toYMD(date));
    setOpen(false);
  }

  function clear() {
    onChange("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={clsx(
          "flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-colors",
          "focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green",
          open ? "border-brand-green ring-1 ring-brand-green" : "border-gray-300",
          value ? "text-brand-charcoal" : "text-brand-muted",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span>{value ? formatDate(value) : placeholder}</span>
        <CalendarIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            showOutsideDays
            defaultMonth={selected ?? new Date()}
            weekStartsOn={1}
            className="rdp-bits"
          />
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={() => handleSelect(new Date())}
              className="text-xs font-medium text-brand-green-dark transition-colors hover:text-brand-green"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={clear}
                className="text-xs font-medium text-brand-muted transition-colors hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 text-brand-muted"
      aria-hidden
    >
      <rect
        x="2.25"
        y="3.5"
        width="11.5"
        height="10.25"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M2.25 6.75h11.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M5.5 1.75v3M10.5 1.75v3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
