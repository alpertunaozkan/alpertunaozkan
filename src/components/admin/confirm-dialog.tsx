"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Geri alınamaz işlemler (silme vb.) için onay penceresi. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Sil",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) onCancel();
      }}
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={pending}>
            Vazgeç
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
