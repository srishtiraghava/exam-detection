"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";

export function useWebcam(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraLive, setCameraLive] = useState(false);
  const [micLive, setMicLive] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setReady(false);
    setCameraLive(false);
    setMicLive(false);
  }, [videoRef]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      setCameraLive(videoTrack?.readyState === "live");
      setMicLive(audioTrack?.readyState === "live");
      videoTrack?.addEventListener("ended", () => setCameraLive(false));
      audioTrack?.addEventListener("ended", () => setMicLive(false));
      setReady(true);
      return stream;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to access camera or microphone";
      setError(message);
      setReady(false);
      throw err;
    }
  }, [videoRef]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    start().catch(() => undefined);
    return () => stop();
  }, [enabled, start, stop]);

  return { ready, error, cameraLive, micLive, start, stop, streamRef };
}
