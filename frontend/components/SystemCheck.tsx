"use client";

import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import type { CheckState, SystemChecks } from "@/hooks/useSystemCheck";

const ITEMS: { key: keyof SystemChecks; title: string }[] = [
  { key: "camera", title: "Camera" },
  { key: "microphone", title: "Microphone" },
  { key: "screen", title: "Screen" },
  { key: "browser", title: "Browser compatibility" },
  { key: "fullscreen", title: "Fullscreen" },
  { key: "face", title: "Face visibility" },
];

function tone(state: CheckState): "ready" | "warning" | "failed" | "idle" {
  if (state === "ready") return "ready";
  if (state === "warning") return "warning";
  if (state === "failed") return "failed";
  return "idle";
}

function label(state: CheckState) {
  if (state === "ready") return "Ready";
  if (state === "warning") return "Action required";
  if (state === "failed") return "Failed";
  return "Not checked";
}

export function SystemCheck({
  checks,
  messages,
  running,
  onRun,
  onRequestScreen,
  onRequestFullscreen,
}: {
  checks: SystemChecks;
  messages: Record<string, string>;
  running: boolean;
  onRun: () => void;
  onRequestScreen: () => void;
  onRequestFullscreen: () => void;
}) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Pre-assessment</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">System check</h2>
          <p className="mt-1 text-sm text-slate-600">Confirm your devices before starting. You can retry any failed check.</p>
        </div>
        <Button disabled={running} onClick={onRun}>
          {running ? "Checking..." : "Run System Check"}
        </Button>
      </div>

      <div className="mt-6 grid gap-3">
        {ITEMS.map((item) => (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3" key={item.key}>
            <div>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-500">{messages[item.key] ?? "Waiting"}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <StatusDot status={tone(checks[item.key])} />
              {label(checks[item.key])}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onRequestScreen} variant="secondary">
          Enable screen sharing
        </Button>
        <Button onClick={onRequestFullscreen} variant="secondary">
          Enter fullscreen
        </Button>
      </div>
    </div>
  );
}
