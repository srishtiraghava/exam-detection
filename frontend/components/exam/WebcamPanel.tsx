import { RefObject } from "react";

export function WebcamPanel({
  videoRef,
  ready,
  faceLabel,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  ready: boolean;
  faceLabel: string;
}) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-3 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Candidate camera</p>
        <span className="text-xs text-slate-500">{ready ? "Live" : "Starting"}</span>
      </div>
      <video autoPlay className="aspect-video w-full rounded-lg bg-slate-900 object-cover" muted playsInline ref={videoRef} />
      <p className="mt-2 text-sm text-slate-600">{faceLabel}</p>
    </div>
  );
}
