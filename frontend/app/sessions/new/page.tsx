"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
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
        exam_name: String(form.get("exam_name")),
      });
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create session");
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-8">
      <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Setup</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create session</h1>
        <p className="mt-2 text-sm text-slate-600">Create a monitored exam session for a candidate.</p>
        <form className="mt-6 grid gap-5" onSubmit={submit}>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["candidate_id", "Candidate ID"],
              ["candidate_name", "Candidate Name"],
              ["exam_id", "Exam ID"],
              ["exam_name", "Exam Name (optional)"],
            ].map(([name, label]) => (
              <label className="grid gap-2 text-sm font-medium text-slate-700" key={name}>
                <span>{label}</span>
                <input
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 outline-none focus:border-brand"
                  name={name}
                  placeholder={label}
                  required={name !== "exam_name"}
                />
              </label>
            ))}
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <Link href="/sessions">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit">Create Session</Button>
          </div>
        </form>
      </div>
    </section>
  );
}
