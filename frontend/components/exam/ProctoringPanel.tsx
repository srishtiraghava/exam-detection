import { StatusDot } from "@/components/ui/status-dot";

export function ProctoringPanel({
  camera,
  recording,
  face,
  microphone,
  violations,
}: {
  camera: boolean;
  recording: boolean;
  face: boolean;
  microphone: boolean;
  violations: number;
}) {
  const rows = [
    { label: "Camera", ok: camera, text: camera ? "Active" : "Stopped" },
    { label: "Screen", ok: recording, text: recording ? "Recording" : "Idle" },
    { label: "Face", ok: face, text: face ? "Detected" : "Not detected" },
    { label: "Microphone", ok: microphone, text: microphone ? "Active" : "Stopped" },
  ];

  return (
    <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Proctoring</p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div className="flex items-center justify-between text-sm" key={row.label}>
            <span className="text-slate-600">{row.label}</span>
            <span className="inline-flex items-center gap-2 text-slate-900">
              <StatusDot status={row.ok ? "ready" : "failed"} />
              {row.text}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
        <span className="text-slate-500">Violations</span>
        <span className="ml-2 font-semibold text-slate-900">{violations}</span>
      </div>
    </div>
  );
}
