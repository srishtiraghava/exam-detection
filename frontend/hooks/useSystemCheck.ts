"use client";

import { RefObject, useCallback, useState } from "react";

export type CheckState = "idle" | "ready" | "warning" | "failed";

export interface SystemChecks {
  camera: CheckState;
  microphone: CheckState;
  screen: CheckState;
  browser: CheckState;
  fullscreen: CheckState;
  face: CheckState;
}

const initial: SystemChecks = {
  camera: "idle",
  microphone: "idle",
  screen: "idle",
  browser: "idle",
  fullscreen: "idle",
  face: "idle",
};

export function useSystemCheck(videoRef: RefObject<HTMLVideoElement | null>) {
  const [checks, setChecks] = useState<SystemChecks>(initial);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);

  const setCheck = (key: keyof SystemChecks, state: CheckState, message?: string) => {
    setChecks((current) => ({ ...current, [key]: state }));
    if (message) {
      setMessages((current) => ({ ...current, [key]: message }));
    }
  };

  const run = useCallback(async () => {
    setRunning(true);
    const chromeLike = typeof navigator.mediaDevices?.getUserMedia === "function";
    const stream = videoRef.current?.srcObject;

    setCheck("browser", chromeLike ? "ready" : "failed", chromeLike ? "Compatible" : "Use Chrome, Edge, or Firefox.");

    if (stream instanceof MediaStream) {
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      setCheck("camera", videoTrack?.readyState === "live" ? "ready" : "failed", videoTrack ? "Connected" : "No camera found");
      setCheck("microphone", audioTrack?.readyState === "live" ? "ready" : "warning", audioTrack ? "Connected" : "No microphone found");
      setCheck("face", videoTrack ? "ready" : "warning", "Keep your face centered in the camera.");
    } else {
      setCheck("camera", "failed", "Permission required. Allow camera access and retry.");
      setCheck("microphone", "failed", "Permission required. Allow microphone access and retry.");
      setCheck("face", "failed", "Camera is required for identity verification.");
    }

    setChecks((current) => ({
      ...current,
      screen: current.screen === "ready" ? "ready" : "warning",
      fullscreen: current.fullscreen === "ready" ? "ready" : document.fullscreenEnabled ? "ready" : "warning",
    }));
    setMessages((current) => ({
      ...current,
      screen: current.screen ?? "Permission required. Click Enable screen sharing.",
      fullscreen: current.fullscreen ?? (document.fullscreenEnabled ? "Supported" : "Fullscreen may be blocked."),
    }));
    setRunning(false);
  }, [videoRef]);

  const markScreen = useCallback((ok: boolean) => {
    setCheck("screen", ok ? "ready" : "failed", ok ? "Connected" : "Screen sharing is required.");
  }, []);

  const markFullscreen = useCallback((ok: boolean) => {
    setCheck("fullscreen", ok ? "ready" : "warning", ok ? "Active" : "Please enter fullscreen before starting.");
  }, []);

  const allReady = checks.camera === "ready" && checks.microphone !== "failed" && checks.screen === "ready";

  return { checks, messages, running, run, markScreen, markFullscreen, allReady };
}
