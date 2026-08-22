"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal description={description} open={open} title={title}>
      <div className="flex justify-end gap-2">
        <Button disabled={busy} onClick={onCancel} variant="secondary">
          {cancelLabel}
        </Button>
        <Button disabled={busy} onClick={onConfirm}>
          {busy ? "Submitting..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
