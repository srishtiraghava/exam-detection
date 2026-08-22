import { labelFor } from "@/lib/proctoring";
import type { ProctoringEvent } from "@/lib/types";

export function ViolationTimeline({ events }: { events: ProctoringEvent[] }) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Proctoring activity</p>
      <div className="mt-3 max-h-64 space-y-3 overflow-auto">
        {events.length === 0 ? <p className="text-sm text-slate-500">No activity yet.</p> : null}
        {events.map((event) => (
          <div className="text-sm" key={event.id}>
            <p className="font-mono text-xs text-slate-500">
              {new Date(event.timestamp).toLocaleTimeString()}
            </p>
            <p className="font-medium text-slate-900">{labelFor(event.type)}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{event.severity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
