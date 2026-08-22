import type { SeverityLabel } from "@/lib/types";

const WEIGHTS: Record<string, number> = {
  MULTIPLE_FACES: 40,
  SCREEN_SHARE_STOPPED: 35,
  CAMERA_STOPPED: 20,
  FULLSCREEN_EXIT: 15,
  TAB_SWITCH: 10,
  NO_FACE: 10,
  FACE_DISAPPEARED: 10,
  MICROPHONE_STOPPED: 10,
  OBJECT_DETECTED: 15,
};

export function computeRiskScore(eventTypes: string[]): number {
  const total = eventTypes.reduce((sum, type) => sum + (WEIGHTS[type] ?? 0), 0);
  return Math.max(0, Math.min(100, total));
}

export function riskLabel(score: number): SeverityLabel {
  if (score <= 20) {
    return "LOW";
  }
  if (score <= 50) {
    return "MEDIUM";
  }
  return "HIGH";
}
