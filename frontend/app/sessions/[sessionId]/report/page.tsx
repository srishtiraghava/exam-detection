"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api, mediaUrl, reportDownloadUrl } from "@/lib/api";
import type { CandidateSession, Incident, Report } from "@/lib/types";

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<CandidateSession | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getSession(sessionId), api.listIncidents(sessionId), api.listReports(sessionId)])
      .then(([sessionData, incidentData, reportData]) => {
        setSession(sessionData);
        setIncidents(incidentData);
        setReports(reportData);
        setError(null);
      })
      .catch((err) => setError(err.message || "Unable to load report data"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const violationIncidents = incidents.filter((incident) => incident.type !== "SESSION_RECORDING");
  const recordingEvidence = incidents.filter((incident) => incident.type === "SESSION_RECORDING");
  const severityTotal = violationIncidents.reduce((total, incident) => total + incident.severity, 0);

  async function generateReport() {
    setBusy(true);
    try {
      const report = await api.createReport(sessionId);
      setReports((current) => [report, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-5 shadow-[0_0_0_1px_rgba(221,208,200,0.2)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#DDD0C8]">Report</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#DDD0C8]">{session?.candidate_name ?? "Session report"}</h1>
            <p className="mt-2 text-sm text-[#DDD0C8]/80">{session?.exam_name ?? session?.exam_id ?? "Candidate report"}</p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-[#323232] px-4 py-2.5 text-sm font-medium text-[#DDD0C8] transition hover:bg-[#323232]/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={generateReport}
            type="button"
          >
            {busy ? "Generating..." : "Generate report"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#DDD0C8]/30 bg-[#323232]/80 p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDD0C8]">Report error</p>
          <h2 className="mt-2 text-xl font-semibold text-[#DDD0C8]">Unable to load report</h2>
          <p className="mt-2 text-sm text-[#DDD0C8]/80">{error}</p>
        </div>
      ) : null}

      {loading && !error ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div className="h-28 animate-pulse rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60" key={idx} />
          ))}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Summary label="Total violations" value={String(violationIncidents.length)} />
          <Summary label="Severity score" value={String(severityTotal)} />
          <Summary label="Session status" value={session?.status ?? "loading"} />
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60">
            <div className="border-b border-[#DDD0C8]/15 px-5 py-4">
              <h2 className="text-lg font-semibold text-[#DDD0C8]">Session Evidence</h2>
            </div>
            <div className="divide-y divide-[#DDD0C8]/15">
              {recordingEvidence.length > 0 ? (
                recordingEvidence.map((incident) =>
                  incident.evidence.map((evidence) => (
                    <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm text-[#DDD0C8]/90" key={evidence.id}>
                      <div>
                        <p className="font-medium text-[#DDD0C8]">{evidence.kind}</p>
                        <p className="text-[#DDD0C8]/80">{new Date(evidence.created_at).toLocaleString()}</p>
                      </div>
                      <a className="rounded-lg border border-[#DDD0C8]/30 px-3 py-2 font-medium text-[#DDD0C8] transition hover:border-[#DDD0C8]/60 hover:text-[#DDD0C8]" href={mediaUrl(evidence.path)}>
                        Open
                      </a>
                    </div>
                  )),
                )
              ) : (
                <div className="px-5 py-6 text-sm text-[#DDD0C8]/80">No recording evidence available for this session.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60">
            <div className="border-b border-[#DDD0C8]/15 px-5 py-4">
              <h2 className="text-lg font-semibold text-[#DDD0C8]">Generated Reports</h2>
            </div>
            <div className="divide-y divide-[#DDD0C8]/15">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm text-[#DDD0C8]/90" key={report.id}>
                    <div>
                      <p className="font-medium text-[#DDD0C8]">{report.status}</p>
                      <p className="text-[#DDD0C8]/80">{new Date(report.created_at).toLocaleString()}</p>
                    </div>
                    {report.status === "ready" ? (
                      <a className="rounded-lg border border-[#DDD0C8]/30 px-3 py-2 font-medium text-[#DDD0C8] transition hover:border-[#DDD0C8]/60 hover:text-[#DDD0C8]" href={reportDownloadUrl(report.id)}>
                        Open
                      </a>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="px-5 py-6 text-sm text-[#DDD0C8]/80">No reports have been generated yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60">
            <div className="border-b border-[#DDD0C8]/15 px-5 py-4">
              <h2 className="text-lg font-semibold text-[#DDD0C8]">Detected Incidents</h2>
            </div>
            <div className="divide-y divide-[#DDD0C8]/15">
              {violationIncidents.length > 0 ? (
                violationIncidents.map((incident) => (
                  <article className="grid gap-2 px-5 py-4 text-sm text-[#DDD0C8]/90" key={incident.id}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <strong className="text-[#DDD0C8]">{incident.type}</strong>
                      <span className="text-[#DDD0C8]/80">{new Date(incident.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-[#DDD0C8]/80">Evidence files: {incident.evidence.length}</p>
                    <div className="flex flex-wrap gap-2">
                      {incident.evidence.map((evidence) => (
                        <a className="rounded-md border border-[#DDD0C8]/30 px-3 py-1 text-xs font-medium text-[#DDD0C8] transition hover:border-[#DDD0C8]/60 hover:text-[#DDD0C8]" href={mediaUrl(evidence.path)} key={evidence.id}>
                          {evidence.kind}
                        </a>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="px-5 py-6 text-sm text-[#DDD0C8]/80">No detected incidents have been raised.</div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-4">
      <p className="text-sm text-[#DDD0C8]/80">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#DDD0C8]">{value}</p>
    </div>
  );
}
