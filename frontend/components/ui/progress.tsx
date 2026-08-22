export function Progress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}
