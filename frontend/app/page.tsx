"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ASSESSMENT, DEMO_CANDIDATE } from "@/lib/examData";

const CHECKLIST = [
  "Camera access",
  "Microphone access",
  "Screen sharing",
  "Full-screen mode",
  "Identity verification",
  "Environment check",
];

export default function HomePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const session = await api.createSession(DEMO_CANDIDATE);
      router.push(`/exam/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create assessment session. Confirm the backend is running.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Assessment Center</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Software Engineering Assessment</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Your camera and screen will be monitored during the assessment. Suspicious activity may be flagged for review.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-slate-500">Exam information</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 py-2">
              <dt className="text-slate-500">Assessment</dt>
              <dd className="font-medium text-slate-900">{ASSESSMENT.name}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-2">
              <dt className="text-slate-500">Duration</dt>
              <dd className="font-medium text-slate-900">{ASSESSMENT.durationMinutes} minutes</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-2">
              <dt className="text-slate-500">Questions</dt>
              <dd className="font-medium text-slate-900">{ASSESSMENT.questionCount}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-2">
              <dt className="text-slate-500">Sections</dt>
              <dd className="font-medium text-slate-900">{ASSESSMENT.sections}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Proctoring</dt>
              <dd className="font-medium text-slate-900">{ASSESSMENT.proctoring}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-slate-500">Candidate: {DEMO_CANDIDATE.candidate_name}</p>
        </section>

        <section className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-slate-500">Before you begin</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {CHECKLIST.map((item) => (
              <li className="flex gap-2" key={item}>
                <span className="text-success">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {error ? <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button disabled={busy} onClick={start}>
          {busy ? "Preparing..." : "Start Assessment"}
        </Button>
        <Link href="/sessions">
          <Button variant="secondary">Reviewer Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
