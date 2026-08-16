"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function CandidateExamPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-5 shadow-[0_0_0_1px_rgba(221,208,200,0.2)]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#DDD0C8]">Candidate session</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#DDD0C8]">{sessionId}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-3">
          <div className="mb-3 flex items-center justify-between px-2 pt-1">
            <div>
              <h2 className="text-lg font-semibold text-[#DDD0C8]">Live Proctoring Feed</h2>
              <p className="text-sm text-[#DDD0C8]/80">Camera and microphone monitoring</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${cameraReady ? "border border-[#DDD0C8]/30 bg-[#DDD0C8]/10 text-[#DDD0C8]" : "border border-[#DDD0C8]/30 bg-[#DDD0C8]/10 text-[#DDD0C8]"}`}>
              {cameraReady ? "Ready" : "Waiting"}
            </span>
          </div>
          <video className="aspect-video w-full rounded-xl bg-[#323232] object-cover" muted playsInline autoPlay ref={videoRef} />
        </div>

        <aside className="rounded-2xl border border-[#DDD0C8]/20 bg-[#323232]/60 p-5">
          <h2 className="text-lg font-semibold text-[#DDD0C8]">Device Status</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl border border-[#DDD0C8]/20 bg-[#323232]/80 p-3">
              <p className={cameraReady ? "text-[#DDD0C8]" : "text-[#DDD0C8]/80"}>{cameraReady ? "Camera and mic ready" : "Waiting for permissions"}</p>
            </div>
            {error ? <p className="rounded-xl border border-[#DDD0C8]/30 bg-[#DDD0C8]/10 p-3 text-[#DDD0C8]">{error}</p> : null}
            <div className="rounded-xl border border-[#DDD0C8]/20 bg-[#323232]/80 p-3 text-[#DDD0C8]/90">
              <div className="flex items-center justify-between">
                <span>Session</span>
                <span className="font-medium text-[#DDD0C8]">{sessionId}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
