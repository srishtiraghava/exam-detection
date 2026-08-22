import { ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-secondaryNavy disabled:bg-slate-300",
  secondary: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-danger text-white hover:bg-red-700",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className, variant = "primary", type = "button", ...props }, ref) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
      styles[variant],
      className,
    )}
    ref={ref}
    type={type}
    {...props}
  />
));

Button.displayName = "Button";
