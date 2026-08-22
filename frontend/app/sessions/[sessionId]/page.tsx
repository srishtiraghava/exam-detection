"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useSessionEvents } from "@/hooks/useSessionEvents";
import { api } from "@/lib/api";
import type { CandidateSession, DetectionStatus, Incident } from "@/lib/types";

export default function SessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const { connected, events } = useSessionEvents(sessionId);
  const [session, setSession] = useState<CandidateSession | null>(null);
  const [status, setStatus] = useState<DetectionStatus | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getSession(sessionId), api.getStatus(sessionId), api.listIncidents(sessionId)])
      .then(([sessionData, statusData, incidentsData]) => {
        setSession(sessionData);
        setStatus(statusData);
        setIncidents(incidentsData);
        setError(null);
      })
      .catch((err) => setError(err.message || "Unable to load session data"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    for (const event of events.slice(0, 1)) {
      if (event.type === "detection.status") {
        setStatus(event.payload as unknown as DetectionStatus);
      }
      if (event.type === "violation.created") {
        setIncidents((current) => [event.payload as unknown as Incident, ...current]);
      }
      if (event.type === "session.started" || event.type === "session.stopped") {
        setSession(event.payload as unknown as CandidateSession);
      }
      if (event.type === "error") {
        const message = event.payload.message;
        setRuntimeError(typeof message === "string" ? message : "Detection worker failed");
        if (event.payload.session) {
          setSession(event.payload.session as CandidateSession);
        }
      }
    }
  }, [events]);

  const violationIncidents = useMemo(
    () => incidents.filter((incident) => incident.type !== "SESSION_RECORDING"),
    [incidents],
  );
  const latestIncident = violationIncidents[0];

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-5 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Session</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{session?.candidate_name ?? "Session"}</h1>
          <p className="mt-2 text-sm text-slate-600">{session?.candidate_id ?? "Candidate details unavailable"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => api.startSession(sessionId).then(setSession)} type="button">
            Start local detection
          </Button>
          <Button onClick={() => api.stopSession(sessionId).then(setSession)} type="button" variant="secondary">
            Stop
          </Button>
          <Link href={`/sessions/${sessionId}/report`}>
            <Button variant="secondary">Report</Button>
          </Link>
          <Link href={`/exam/${sessionId}`}>
            <Button variant="secondary">Candidate exam</Button>
          </Link>
        </div>
      </div>

      {error ? <p className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-danger">{error}</p> : null}
      {runtimeError ? <p className="rounded-card border border-orange-200 bg-orange-50 p-4 text-sm text-warning">{runtimeError}</p> : null}

      {loading && !error ? <div className="h-28 animate-pulse rounded-card border border-slate-200 bg-white" /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Session" value={session?.status ?? "loading"} />
        <Metric label="Events" value={connected ? "connected" : "offline"} />
        <Metric label="Face" value={status?.face_present ? "present" : "absent"} />
        <Metric label="Violations" value={String(violationIncidents.length)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Monitoring status</h2>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <StatusRow label="Exam" value={session?.exam_name ?? session?.exam_id ?? "unknown"} />
            <StatusRow label="Gaze" value={status?.gaze_direction ?? "unknown"} />
            <StatusRow label="Face count" value={status ? String(status.face_count ?? 0) : "unknown"} />
            <StatusRow label="Mouth" value={status?.mouth_moving ? "moving" : "still"} />
            <StatusRow label="Multiple faces" value={status?.multiple_faces ? "yes" : "no"} />
            <StatusRow label="Objects" value={status?.objects_detected ? "detected" : "clear"} />
            <StatusRow label="Updated" value={status ? new Date(status.timestamp).toLocaleTimeString() : "unknown"} />
            <StatusRow label="Connection" value={connected ? "Live" : "Offline"} />
          </div>
        </div>
        <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Latest violation</h2>
          {latestIncident ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium">{latestIncident.type}</p>
              <p className="text-slate-500">{new Date(latestIncident.timestamp).toLocaleString()}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No violations yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-card border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Violation timeline</h2>
          <span className="text-xs uppercase tracking-[0.14em] text-slate-500">{violationIncidents.length} events</span>
        </div>
        <div className="divide-y divide-slate-100">
          {violationIncidents.length > 0 ? (
            violationIncidents.map((incident) => (
              <div className="flex items-center justify-between px-5 py-4 text-sm" key={incident.id}>
                <span className="font-medium">{incident.type}</span>
                <span className="text-slate-500">{new Date(incident.timestamp).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm text-slate-500">No violation events have been recorded yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
