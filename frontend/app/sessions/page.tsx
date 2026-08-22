"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { riskLabel } from "@/lib/riskScore";
import type { CandidateSession } from "@/lib/types";

function statusTone(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "failed") return "danger" as const;
  if (status === "running") return "brand" as const;
  return "neutral" as const;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<CandidateSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .listSessions()
      .then(setSessions)
      .catch((err) => setError(err.message || "Failed to fetch sessions"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Reviewer dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Candidate sessions</h1>
          <p className="mt-2 text-sm text-slate-600">Scores, proctoring risk, and review status for each assessment.</p>
        </div>
        <Link href="/sessions/new">
          <Button>New Session</Button>
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-danger">
          {error}
          <Button className="ml-4" onClick={loadSessions} variant="secondary">
            Retry
          </Button>
        </div>
      ) : null}

      {loading && !error ? <div className="mt-6 h-40 animate-pulse rounded-card border border-slate-200 bg-white" /> : null}

      {!loading && !error && sessions.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No sessions yet</h2>
          <p className="mt-2 text-sm text-slate-600">Start an assessment or create a monitored session.</p>
        </div>
      ) : null}

      {!loading && !error && sessions.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Assessment</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const score = session.exam_score;
                const risk = session.risk_score;
                const duration = session.duration_seconds;
                const review = (risk ?? 0) > 20 || (session.status === "completed" && (risk ?? 0) > 0);
                return (
                  <tr className="border-t border-slate-100 hover:bg-slate-50" key={session.id}>
                    <td className="px-4 py-4">
                      <Link className="font-medium text-brand hover:underline" href={`/sessions/${session.id}`}>
                        {session.candidate_name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{session.exam_name ?? session.exam_id}</td>
                    <td className="px-4 py-4">{score == null ? "—" : `${score}%`}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {duration == null ? "—" : `${Math.floor(duration / 60)}m ${duration % 60}s`}
                    </td>
                    <td className="px-4 py-4">
                      {risk == null ? (
                        "—"
                      ) : (
                        <Badge tone={riskLabel(risk) === "HIGH" ? "danger" : riskLabel(risk) === "MEDIUM" ? "warning" : "success"}>
                          {riskLabel(risk)} · {risk}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={statusTone(session.status)}>{session.status}</Badge>
                        {review && session.status === "completed" ? <Badge tone="warning">Review required</Badge> : null}
                        {session.status === "completed" ? (
                          <Link className="text-xs text-brand hover:underline" href={`/exam/${session.id}/results`}>
                            Results
                          </Link>
                        ) : (
                          <Link className="text-xs text-brand hover:underline" href={`/exam/${session.id}`}>
                            Exam
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
