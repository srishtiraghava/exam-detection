"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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
    <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-5 shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Report</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{session?.candidate_name ?? "Session report"}</h1>
          <p className="mt-2 text-sm text-slate-600">{session?.exam_name ?? session?.exam_id ?? "Candidate report"}</p>
        </div>
        <Button disabled={busy} onClick={generateReport}>
          {busy ? "Generating..." : "Generate report"}
        </Button>
      </div>

      {error ? <p className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-danger">{error}</p> : null}
      {loading && !error ? <div className="h-28 animate-pulse rounded-card border border-slate-200 bg-white" /> : null}

      {!loading && !error ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Summary label="Total violations" value={String(violationIncidents.length)} />
          <Summary label="Severity score" value={String(severityTotal)} />
          <Summary label="Session status" value={session?.status ?? "loading"} />
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <Panel title="Session evidence">
            {recordingEvidence.length > 0 ? (
              recordingEvidence.map((incident) =>
                incident.evidence.map((item) => (
                  <div className="flex items-center justify-between px-5 py-4 text-sm" key={item.id}>
                    <div>
                      <p className="font-medium">{item.kind}</p>
                      <p className="text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <a className="text-brand hover:underline" href={mediaUrl(item.path)}>
                      Open
                    </a>
                  </div>
                )),
              )
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">No recording evidence available for this session.</p>
            )}
          </Panel>
          <Panel title="Generated reports">
            {reports.length > 0 ? (
              reports.map((report) => (
                <div className="flex items-center justify-between px-5 py-4 text-sm" key={report.id}>
                  <div>
                    <p className="font-medium">{report.status}</p>
                    <p className="text-slate-500">{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  {report.status === "ready" ? (
                    <a className="text-brand hover:underline" href={reportDownloadUrl(report.id)}>
                      Open
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">No reports have been generated yet.</p>
            )}
          </Panel>
          <Panel title="Detected incidents">
            {violationIncidents.length > 0 ? (
              violationIncidents.map((incident) => (
                <article className="px-5 py-4 text-sm" key={incident.id}>
                  <div className="flex justify-between">
                    <strong>{incident.type}</strong>
                    <span className="text-slate-500">{new Date(incident.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {incident.evidence.map((item) => (
                      <a className="rounded-md border border-slate-200 px-3 py-1 text-xs" href={mediaUrl(item.path)} key={item.id}>
                        {item.kind}
                      </a>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">No detected incidents have been raised.</p>
            )}
          </Panel>
        </>
      ) : null}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}
