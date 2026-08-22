import { cn } from "@/lib/utils";

type Status = "ready" | "warning" | "failed" | "idle" | "recording";

const colors: Record<Status, string> = {
  ready: "bg-success",
  warning: "bg-warning",
  failed: "bg-danger",
  idle: "bg-slate-300",
  recording: "bg-danger",
};

export function StatusDot({ status, pulse = false }: { status: Status; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse ? (
        <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", colors[status])} />
      ) : null}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", colors[status])} />
    </span>
  );
}
