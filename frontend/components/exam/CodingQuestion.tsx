"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/exam/CodeEditor";
import { runTwoSum } from "@/lib/codeRunner";
import type { CodingQuestionData } from "@/lib/types";

export function CodingQuestion({
  question,
  language,
  source,
  onLanguage,
  onSource,
  onPassed,
}: {
  question: CodingQuestionData;
  language: string;
  source: string;
  onLanguage: (language: string) => void;
  onSource: (source: string) => void;
  onPassed: (passed: boolean) => void;
}) {
  const [output, setOutput] = useState<string | null>(null);

  function run() {
    const result = runTwoSum(source, language);
    onPassed(result.passed);
    setOutput(
      result.results
        .map((item) => `${item.passed ? "PASS" : "FAIL"} ${item.name}: expected ${item.expected}, got ${item.actual}`)
        .join("\n"),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {question.topic} · {question.difficulty}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">{question.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">{question.question}</p>
        <div className="mt-5 space-y-2 text-sm">
          {question.examples.map((example) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={example.input}>
              <p>
                <span className="font-medium">Input:</span> {example.input}
              </p>
              <p>
                <span className="font-medium">Output:</span> {example.output}
              </p>
            </div>
          ))}
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {question.constraints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            onChange={(event) => onLanguage(event.target.value)}
            value={language}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={run} variant="secondary">
              Run Code
            </Button>
            <Button onClick={run}>Submit</Button>
          </div>
        </div>
        <CodeEditor language={language} onChange={onSource} value={source} />
        {output ? (
          <pre className="mt-3 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">{output}</pre>
        ) : null}
      </div>
    </div>
  );
}
