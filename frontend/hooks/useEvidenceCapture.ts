"use client";

import { RefObject, useCallback } from "react";

import type { IncidentType, LocalEvidence, SeverityLabel } from "@/lib/types";
import { severityFor } from "@/lib/proctoring";

export function useEvidenceCapture(videoRef: RefObject<HTMLVideoElement | null>) {
  const captureScreenshot = useCallback(
    async (eventType: IncidentType, faceCount?: number) => {
      const video = videoRef.current;
      const timestamp = new Date().toISOString();
      const severity: SeverityLabel = severityFor(eventType);

      if (!video || video.readyState < 2) {
        return {
          blob: null as Blob | null,
          url: undefined as string | undefined,
          timestamp,
          evidence: null as LocalEvidence | null,
        };
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const context = canvas.getContext("2d");
      if (!context) {
        return { blob: null, url: undefined, timestamp, evidence: null };
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
      const url = blob ? URL.createObjectURL(blob) : dataUrl;
      const evidence: LocalEvidence = {
        id: crypto.randomUUID(),
        eventId: crypto.randomUUID(),
        timestamp,
        type: eventType,
        imageUrl: dataUrl,
        faceCount,
        severity,
      };
      return { blob, url, timestamp, evidence, dataUrl };
    },
    [videoRef],
  );

  return { captureScreenshot };
}
