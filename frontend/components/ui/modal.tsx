"use client";

import { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-card border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          {onClose ? (
            <Button className="px-2 py-1 text-slate-500" onClick={onClose} variant="ghost">
              Close
            </Button>
          ) : null}
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
