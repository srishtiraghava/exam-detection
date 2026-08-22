import type { LocalEvidence } from "@/lib/types";
import { labelFor } from "@/lib/proctoring";

export function EvidenceGallery({ items }: { items: LocalEvidence[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No screenshots were captured during this assessment.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <article className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card" key={item.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={labelFor(item.type)} className="h-40 w-full object-cover" src={item.imageUrl} />
          <div className="p-3">
            <p className="font-medium text-slate-900">{labelFor(item.type)}</p>
            <p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
            {item.faceCount !== undefined ? <p className="mt-1 text-sm text-slate-600">{item.faceCount} faces detected</p> : null}
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{item.severity}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
