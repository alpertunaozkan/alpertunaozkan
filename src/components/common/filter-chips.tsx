"use client";

import { cn } from "@/lib/utils";

export interface FilterChipOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterChipsProps {
  label: string;
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Tek seçimli filtre düğmeleri (aria-pressed ile erişilebilir). */
export function FilterChips({ label, options, value, onChange, className }: FilterChipsProps) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              active
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-navy-900/12 bg-white text-slate-700 hover:border-navy-900/30 hover:text-navy-950",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  active ? "bg-white/15 text-white" : "bg-navy-50 text-navy-700",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
