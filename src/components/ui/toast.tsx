"use client";

import { createContext, use, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Kapanış animasyonu oynatılıyor. */
  leaving?: boolean;
}

interface ToastContextValue {
  notify: (toast: Omit<Toast, "id" | "leaving">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 4500;
/** globals.css → --animate-toast-out süresiyle uyumlu. */
const EXIT_MS = 180;

const toneStyles: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CircleCheck, className: "text-emerald-600" },
  error: { icon: CircleAlert, className: "text-red-600" },
  info: { icon: Info, className: "text-navy-600" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  function dismiss(id: number) {
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, EXIT_MS);
  }

  function notify(toast: Omit<Toast, "id" | "leaving">) {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    window.setTimeout(() => dismiss(id), DURATION_MS);
  }

  return (
    <ToastContext value={{ notify }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {toasts.map((toast) => {
          const { icon: Icon, className } = toneStyles[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-navy-900/10 bg-white p-4 shadow-elevated",
                toast.leaving
                  ? "pointer-events-none motion-safe:animate-toast-out motion-reduce:hidden"
                  : "motion-safe:animate-toast-in",
              )}
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", className)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy-950">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-sm text-slate-600">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-m-1 inline-flex size-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Bildirimi kapat"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const context = use(ToastContext);
  if (!context) throw new Error("useToast, ToastProvider içinde kullanılmalıdır.");
  return context;
}
