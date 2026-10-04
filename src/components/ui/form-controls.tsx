import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-lg border border-slate-300 bg-white text-[15px] text-navy-950 shadow-xs transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/12 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/15";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, "h-11 px-3.5", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(controlBase, "min-h-28 px-3.5 py-3 leading-relaxed", className)} {...props} />
  );
}

export function Select({
  className,
  wrapperClassName,
  ...props
}: ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select className={cn(controlBase, "select-enhanced h-11 pr-10 pl-3.5", className)} {...props} />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-navy-950", className)} {...props} />;
}

interface FieldProps {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  /** Etiketin yanına (sağa) yerleşen ek içerik, örn. karakter sayacı. */
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * Etiket + kontrol + yardım/hata metni. Kontrole `fieldAria(id, error, hint)`
 * ile üretilen aria özniteliklerinin verilmesi beklenir.
 */
export function Field({ id, label, required, hint, error, className, aside, children }: FieldProps) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          ) : null}
        </Label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600 motion-safe:animate-fade-in">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function fieldAria(id: string, error?: string, hint?: ReactNode) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}
