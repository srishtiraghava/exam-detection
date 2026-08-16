"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { CandidateSession } from "@/lib/types";

const statusStyles: Record<string, string> = {
  created: "bg-[#323232] text-[#DDD0C8] ring-1 ring-inset ring-[#DDD0C8]/30",
  running: "bg-[#DDD0C8]/20 text-[#DDD0C8] ring-1 ring-inset ring-[#DDD0C8]/30",
  stopping: "bg-[#DDD0C8]/15 text-[#DDD0C8] ring-1 ring-inset ring-[#DDD0C8]/25",
  completed: "bg-[#DDD0C8]/10 text-[#DDD0C8] ring-1 ring-inset ring-[#DDD0C8]/20",
  failed: "bg-[#DDD0C8]/10 text-[#DDD0C8] ring-1 ring-inset ring-[#DDD0C8]/20"
};

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
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-5 shadow-[0_0_0_1px_rgba(221,208,200,0.2)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#DDD0C8]">Monitoring</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#DDD0C8]">Candidate Sessions</h1>
          <p className="mt-2 text-sm text-[#DDD0C8]/80">Live and completed proctoring sessions across the active exam fleet.</p>
        </div>
        <Link className="inline-flex items-center justify-center rounded-lg bg-[#323232] px-4 py-2.5 text-sm font-medium text-[#DDD0C8] transition hover:bg-[#323232]/90" href="/sessions/new">
          New Session
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#DDD0C8]/30 bg-[#323232]/80 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDD0C8]">Runtime issue</p>
              <h2 className="mt-2 text-xl font-semibold text-[#DDD0C8]">Unable to load sessions</h2>
              <p className="mt-1 text-sm text-[#DDD0C8]/80">The session list could not be retrieved right now. Please try again.</p>
              <p className="mt-3 text-sm text-[#DDD0C8]">{error}</p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-[#DDD0C8]/30 bg-[#DDD0C8] px-4 py-2.5 text-sm font-medium text-[#323232] transition hover:bg-[#DDD0C8]/90"
              onClick={loadSessions}
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {loading && !error ? (
        <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-4">
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div className="grid grid-cols-[1.5fr_1.5fr_0.8fr_1.2fr] gap-3 animate-pulse" key={idx}>
                <div className="h-11 rounded-lg bg-[#DDD0C8]/15" />
                <div className="h-11 rounded-lg bg-[#DDD0C8]/15" />
                <div className="h-11 rounded-lg bg-[#DDD0C8]/15" />
                <div className="h-11 rounded-lg bg-[#DDD0C8]/15" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !error && sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDD0C8]/30 bg-[#323232]/40 p-10 text-center">
          <h2 className="text-xl font-semibold text-[#DDD0C8]">No active sessions</h2>
          <p className="mt-2 text-sm text-[#DDD0C8]/80">There are no candidate sessions yet. Create one to begin monitoring.</p>
          <Link className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#323232] px-4 py-2.5 text-sm font-medium text-[#DDD0C8] transition hover:bg-[#323232]/90" href="/sessions/new">
            Create session
          </Link>
        </div>
      ) : null}

      {!loading && !error && sessions.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 shadow-[0_0_0_1px_rgba(221,208,200,0.2)]">
          <table className="w-full border-collapse text-sm text-[#DDD0C8]/90">
            <thead className="bg-[#323232]/80 text-left text-xs uppercase tracking-[0.18em] text-[#DDD0C8]/80">
              <tr>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Exam</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr className="border-t border-[#DDD0C8]/15 transition-colors hover:bg-[#DDD0C8]/5" key={session.id}>
                  <td className="px-4 py-4">
                    <Link className="font-medium text-[#DDD0C8] transition hover:text-[#DDD0C8]/80" href={`/sessions/${session.id}`}>
                      {session.candidate_name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-[#DDD0C8]/80">{session.exam_name ?? session.exam_id}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[session.status] ?? statusStyles.created}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#DDD0C8]/80">{new Date(session.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
