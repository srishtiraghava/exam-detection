import { StatusDot } from "@/components/ui/status-dot";

export function ExamHeader({
  assessment,
  current,
  total,
  timer,
  recording,
  proctoring,
}: {
  assessment: string;
  current: number;
  total: number;
  timer: string;
  recording: boolean;
  proctoring: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Assessment</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">{assessment}</h1>
      </div>
      <p className="text-sm text-slate-600">
        Question {current} of {total}
      </p>
      <p className="font-mono text-lg font-semibold tabular-nums text-slate-900">{timer}</p>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <StatusDot pulse={recording} status={recording ? "recording" : "idle"} />
          {recording ? "Recording" : "Not recording"}
        </span>
        <span className="inline-flex items-center gap-2">
          <StatusDot status={proctoring ? "ready" : "idle"} />
          {proctoring ? "Proctoring Active" : "Standby"}
        </span>
      </div>
    </header>
  );
}
