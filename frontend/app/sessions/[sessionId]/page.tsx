"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import type { CandidateSession, DetectionStatus, Incident } from "@/lib/types";
import { useSessionEvents } from "@/hooks/useSessionEvents";

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

  const violationIncidents = useMemo(() => incidents.filter((incident) => incident.type !== "SESSION_RECORDING"), [incidents]);
  const latestIncident = useMemo(() => violationIncidents[0], [violationIncidents]);

  async function start() {
    setSession(await api.startSession(sessionId));
  }

  async function stop() {
    setSession(await api.stopSession(sessionId));
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-5 shadow-[0_0_0_1px_rgba(221,208,200,0.2)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#DDD0C8]">Session</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#DDD0C8]">{session?.candidate_name ?? "Session"}</h1>
            <p className="mt-2 text-sm text-[#DDD0C8]/80">{session?.candidate_id ?? "Candidate details unavailable"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-[#DDD0C8] px-4 py-2.5 text-sm font-medium text-[#323232] transition hover:bg-[#DDD0C8]/90" onClick={start} type="button">
              Start
            </button>
            <button className="rounded-lg bg-[#323232] px-4 py-2.5 text-sm font-medium text-[#DDD0C8] transition hover:bg-[#323232]/90" onClick={stop} type="button">
              Stop
            </button>
            <Link className="rounded-lg border border-[#DDD0C8]/30 bg-[#323232] px-4 py-2.5 text-sm font-medium text-[#DDD0C8] transition hover:bg-[#323232]/90" href={`/sessions/${sessionId}/report`}>
              Report
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#DDD0C8]/30 bg-[#323232]/80 p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDD0C8]">Session error</p>
          <h2 className="mt-2 text-xl font-semibold text-[#DDD0C8]">Unable to load session</h2>
          <p className="mt-2 text-sm text-[#DDD0C8]/80">{error}</p>
        </div>
      ) : null}

      {runtimeError ? (
        <div className="rounded-2xl border border-[#DDD0C8]/30 bg-[#DDD0C8]/10 p-4 text-sm text-[#DDD0C8]">
          {runtimeError}
        </div>
      ) : null}

      {loading && !error ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div className="h-28 animate-pulse rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60" key={idx} />
          ))}
        </div>
      ) : null}

      {!loading || !!session ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Session" value={session?.status ?? "loading"} />
          <Metric label="Events" value={connected ? "connected" : "offline"} />
          <Metric label="Face" value={status?.face_present ? "present" : "absent"} />
          <Metric label="Violations" value={String(violationIncidents.length)} />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#DDD0C8]">Monitoring Status</h2>
            <span className="rounded-full border border-[#DDD0C8]/30 bg-[#DDD0C8]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#DDD0C8]">
              Active
            </span>
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <StatusRow label="Exam" value={session?.exam_name ?? session?.exam_id ?? "unknown"} />
            <StatusRow label="Gaze" value={status?.gaze_direction ?? "unknown"} />
            <StatusRow label="Eye ratio" value={status ? status.eye_ratio.toFixed(3) : "unknown"} />
            <StatusRow label="Mouth" value={status?.mouth_moving ? "moving" : "still"} />
            <StatusRow label="Multiple faces" value={status?.multiple_faces ? "yes" : "no"} />
            <StatusRow label="Objects" value={status?.objects_detected ? "detected" : "clear"} />
            <StatusRow label="Updated" value={status ? new Date(status.timestamp).toLocaleTimeString() : "unknown"} />
            <StatusRow label="Connection" value={connected ? "Live" : "Offline"} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-5">
          <h2 className="text-lg font-semibold text-[#DDD0C8]">Latest Violation</h2>
          {latestIncident ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="inline-flex rounded-full border border-[#DDD0C8]/30 bg-[#DDD0C8]/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#DDD0C8]">
                {latestIncident.type}
              </p>
              <p className="text-[#DDD0C8]/80">{new Date(latestIncident.timestamp).toLocaleString()}</p>
              <p className="text-[#DDD0C8]/90">Severity {latestIncident.severity}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#DDD0C8]/80">No violations yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60">
        <div className="flex items-center justify-between border-b border-[#DDD0C8]/15 px-5 py-4">
          <h2 className="text-lg font-semibold text-[#DDD0C8]">Violation Timeline</h2>
          <span className="text-xs uppercase tracking-[0.18em] text-[#DDD0C8]/70">{violationIncidents.length} events</span>
        </div>
        <div className="divide-y divide-[#DDD0C8]/15">
          {violationIncidents.length > 0 ? (
            violationIncidents.map((incident) => (
              <div className="grid gap-2 px-5 py-4 text-sm text-[#DDD0C8]/90" key={incident.id}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-[#DDD0C8]">{incident.type}</span>
                  <span className="text-[#DDD0C8]/80">{new Date(incident.timestamp).toLocaleString()}</span>
                </div>
                <span className="text-[#DDD0C8]/80">Status: {incident.status}</span>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm text-[#DDD0C8]/80">No violation events have been recorded yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-4">
      <p className="text-sm text-[#DDD0C8]/80">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#DDD0C8]">{value}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#DDD0C8]/20 bg-[#323232]/80 px-3 py-2.5 text-sm">
      <span className="text-[#DDD0C8]/80">{label}</span>
      <span className="font-medium text-[#DDD0C8]">{value}</span>
    </div>
  );
}
