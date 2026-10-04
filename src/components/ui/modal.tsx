"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialogPresence } from "./use-dialog-presence";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
} as const;

/**
 * Native <dialog> tabanlı modal: odak hapsi, Esc ile kapanma ve arka planın
 * etkisizleştirilmesi tarayıcı tarafından sağlanır (ek bağımlılık yok).
 * Açılış/kapanış animasyonu globals.css'teki `.dialog-pop` sınıfındadır.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const present = useDialogPresence(dialogRef, open);
  const titleId = useId();
  const descriptionId = useId();

  // Kapanış animasyonu sürerken içerik, kapanmadan önceki son hâliyle gösterilir
  // (çağıran bileşen bu sırada seçili kaydı temizlemiş olabilir).
  const [lastOpen, setLastOpen] = useState({ title, description, children, footer });
  if (
    open &&
    (lastOpen.title !== title ||
      lastOpen.description !== description ||
      lastOpen.children !== children ||
      lastOpen.footer !== footer)
  ) {
    setLastOpen({ title, description, children, footer });
  }
  const shown = open ? { title, description, children, footer } : lastOpen;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={shown.description ? descriptionId : undefined}
      onClose={(event) => {
        // React, "close" olayını iç içe diyaloglarda üst bileşenlere de iletir;
        // yalnızca bu diyaloğun kendi kapanışı işlenir.
        if (event.target === event.currentTarget) onClose();
      }}
      onClick={(event) => {
        // Yalnızca karartılmış arka plana tıklanınca kapat.
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "dialog-pop m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 text-left shadow-elevated",
        sizes[size],
        className,
      )}
    >
      {present ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-navy-900/[0.07] px-6 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-navy-950">
                {shown.title}
              </h2>
              {shown.description ? (
                <p id={descriptionId} className="mt-1 text-sm text-slate-600">
                  {shown.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-950"
              aria-label="Kapat"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {shown.children ? <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{shown.children}</div> : null}
          {shown.footer ? (
            <div className="flex flex-wrap justify-end gap-2 border-t border-navy-900/[0.07] bg-slate-50/70 px-6 py-4">
              {shown.footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
