"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone: "info" | "warning" | "danger" };

const ToastContext = createContext<{ notify: (message: string, tone?: Toast["tone"]) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 grid gap-2">
        {toasts.map((toast) => (
          <div
            className={`rounded-lg border px-4 py-3 text-sm shadow-card ${
              toast.tone === "danger"
                ? "border-red-200 bg-red-50 text-danger"
                : toast.tone === "warning"
                  ? "border-orange-200 bg-orange-50 text-warning"
                  : "border-slate-200 bg-white text-slate-800"
            }`}
            key={toast.id}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { notify: () => undefined };
  }
  return context;
}
