"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { EvidenceGallery } from "@/components/exam/EvidenceGallery";
import { ViolationTimeline } from "@/components/exam/ViolationTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { labelFor } from "@/lib/proctoring";
import type { ExamResults, LocalEvidence, ProctoringEvent } from "@/lib/types";

function tone(label: string) {
  if (label === "HIGH") return "danger" as const;
  if (label === "MEDIUM") return "warning" as const;
  return "success" as const;
}

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [results, setResults] = useState<ExamResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localEvents, setLocalEvents] = useState<ProctoringEvent[]>([]);
  const [localEvidence, setLocalEvidence] = useState<LocalEvidence[]>([]);

  useEffect(() => {
    api
      .getResults(sessionId)
      .then(setResults)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load results"));
    try {
      const raw = sessionStorage.getItem(`exam-local-${sessionId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { events?: ProctoringEvent[]; evidence?: LocalEvidence[] };
        setLocalEvents(parsed.events ?? []);
        setLocalEvidence(parsed.evidence ?? []);
      }
    } catch {
      // Ignore storage errors.
    }
  }, [sessionId]);

  const timeline = useMemo(() => {
    if (localEvents.length) {
      return localEvents;
    }
    return (results?.incidents ?? []).map((incident) => ({
      id: incident.id,
      type: incident.type,
      timestamp: incident.timestamp,
      severity: incident.severity >= 4 ? "HIGH" : incident.severity >= 2 ? "MEDIUM" : "LOW",
      metadata: incident.metadata,
    })) as ProctoringEvent[];
  }, [localEvents, results]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 text-sm text-slate-500">Loading results…</div>
    );
  }

  const duration = `${Math.floor(results.durationSeconds / 60)}m ${results.durationSeconds % 60}s`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Assessment complete</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">Results</h1>
      <p className="mt-2 text-sm text-slate-600">
        {results.session.candidate_name} · {results.session.exam_name ?? "Software Engineering Assessment"} · {duration}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Score</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {results.score} / {results.mcqTotal + 1}
          </p>
          <p className="mt-1 text-sm text-slate-500">{results.percent}%</p>
        </div>
        <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">MCQ</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {results.mcqCorrect} / {results.mcqTotal}
          </p>
        </div>
        <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Coding</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{results.codingPassed ? "Passed" : "Not passed"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Proctoring</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{results.incidents.length} violations</p>
          <p className="mt-2 text-sm text-slate-600">
            {results.severityCounts.HIGH} High · {results.severityCounts.MEDIUM} Medium · {results.severityCounts.LOW} Low
          </p>
        </div>
        <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Proctoring Risk Score</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-semibold text-slate-900">{results.riskScore}</p>
            <Badge tone={tone(results.riskLabel)}>{results.riskLabel}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-500">Deterministic rule-based score, not an AI probability model.</p>
        </div>
      </div>

      <section className="mt-8 rounded-card border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">Performance breakdown</h2>
        <div className="mt-4 space-y-3">
          {results.topicScores.map((topic) => (
            <div className="flex items-center justify-between text-sm" key={topic.topic}>
              <span className="text-slate-600">{topic.topic}</span>
              <span className="font-medium text-slate-900">{topic.percent}%</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Coding · Two Sum</span>
            <span className="font-medium text-slate-900">{results.codingPassed ? "100%" : "0%"}</span>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ViolationTimeline events={timeline} />
        <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Evidence</p>
          <div className="mt-3">
            <EvidenceGallery items={localEvidence} />
            {localEvidence.length === 0 && results.incidents.some((item) => item.evidence.length > 0) ? (
              <div className="mt-3 space-y-2 text-sm">
                {results.incidents.flatMap((incident) =>
                  incident.evidence.map((item) => (
                    <p key={item.id}>
                      {labelFor(incident.type)} · {new Date(incident.timestamp).toLocaleTimeString()}
                    </p>
                  )),
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-8 flex gap-3">
        <Link href="/sessions">
          <Button>Open reviewer dashboard</Button>
        </Link>
        <Link href={`/sessions/${sessionId}`}>
          <Button variant="secondary">Live session view</Button>
        </Link>
      </div>
    </div>
  );
}
