"use client";

import { useCallback, useRef, useState } from "react";

export function useScreenRecording() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(
    () => typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia,
  );

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setShared(false);
  }, []);

  const requestShare = useCallback(async (onShareStopped?: () => void) => {
    setError(null);
    if (!supported) {
      setError("Screen recording is not supported in this browser.");
      throw new Error("unsupported");
    }
    try {
      stopTracks();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      setShared(true);
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setRecording(false);
        setShared(false);
        onShareStopped?.();
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Screen sharing was not granted.";
      setError(message);
      setShared(false);
      throw err;
    }
  }, [stopTracks, supported]);

  const start = useCallback(
    async (onShareStopped?: () => void) => {
      if (!streamRef.current || streamRef.current.getVideoTracks()[0]?.readyState !== "live") {
        await requestShare(onShareStopped);
      }
      const stream = streamRef.current;
      if (!stream) {
        throw new Error("No screen stream");
      }
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onerror = () => setError("Screen recording failed.");
      recorder.start(1000);
      setRecording(true);
      return true;
    },
    [requestShare],
  );

  const stop = useCallback(async () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
    }
    stopTracks();
    setRecording(false);
    const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type: "video/webm" }) : null;
    recorderRef.current = null;
    return blob;
  }, [stopTracks]);

  return { recording, shared, error, supported, requestShare, start, stop, stopTracks };
}
