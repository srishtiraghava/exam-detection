"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { api } from "@/lib/api";

export default function NewSessionPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const session = await api.createSession({
        candidate_id: String(form.get("candidate_id")),
        candidate_name: String(form.get("candidate_name")),
        exam_id: String(form.get("exam_id")),
        exam_name: String(form.get("exam_name"))
      });
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create session");
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-6 shadow-[0_0_0_1px_rgba(221,208,200,0.2)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#DDD0C8]">Setup</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#DDD0C8]">Create Session</h1>
          </div>
          <Link className="inline-flex items-center justify-center rounded-lg border border-[#DDD0C8]/30 bg-[#DDD0C8] px-3 py-2 text-sm font-medium text-[#323232] transition hover:bg-[#DDD0C8]/90" href="/sessions">
            Cancel
          </Link>
        </div>
        <p className="mt-3 max-w-xl text-sm text-[#DDD0C8]/80">Create a monitored exam session for a candidate and begin collecting live detection signals.</p>

        <form className="mt-6 grid gap-5" onSubmit={submit}>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["candidate_id", "Candidate ID"],
              ["candidate_name", "Candidate Name"],
              ["exam_id", "Exam ID"],
              ["exam_name", "Exam Name (optional)"]
            ].map(([name, label]) => (
              <label className="grid gap-2 text-sm font-medium text-[#DDD0C8]/90" key={name}>
                <span>{label}</span>
                <input
                  className="rounded-lg border border-[#DDD0C8]/30 bg-[#323232]/80 px-3.5 py-2.5 text-[#DDD0C8] placeholder:text-[#DDD0C8]/50 outline-none transition focus:border-[#DDD0C8]/60 focus:ring-2 focus:ring-[#DDD0C8]/20"
                  name={name}
                  placeholder={label}
                  required={name !== "exam_name"}
                />
              </label>
            ))}
          </div>

          {error ? (
            <div className="rounded-xl border border-[#DDD0C8]/30 bg-[#DDD0C8]/10 p-3 text-sm text-[#DDD0C8]">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-[#DDD0C8]/15 pt-5">
            <Link className="rounded-lg border border-[#DDD0C8]/30 bg-[#DDD0C8] px-4 py-2.5 text-sm font-medium text-[#323232] transition hover:bg-[#DDD0C8]/90" href="/sessions">
              Back to sessions
            </Link>
            <button className="rounded-lg bg-[#323232] px-4 py-2.5 text-sm font-medium text-[#DDD0C8] transition hover:bg-[#323232]/90" type="submit">
              Create Session
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
