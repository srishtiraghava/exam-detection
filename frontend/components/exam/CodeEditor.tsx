"use client";

export function CodeEditor({
  language,
  value,
  onChange,
}: {
  language: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      className="min-h-[280px] w-full rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      value={value}
      aria-label={`${language} editor`}
    />
  );
}
