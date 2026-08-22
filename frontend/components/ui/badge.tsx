import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-green-50 text-success",
  warning: "bg-orange-50 text-warning",
  danger: "bg-red-50 text-danger",
  brand: "bg-slate-900/5 text-brand",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}
