export function ExamTimer({ value, warn }: { value: string; warn: boolean }) {
  return <span className={`font-mono text-lg tabular-nums ${warn ? "text-danger" : "text-slate-900"}`}>{value}</span>;
}
