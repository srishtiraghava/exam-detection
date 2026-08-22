import type { IncidentType, SeverityLabel } from "@/lib/types";

export const FACE_HOLD_MS = 2000;
export const EVENT_COOLDOWN_MS = 8000;

export const EVENT_SEVERITY: Record<string, SeverityLabel> = {
  MULTIPLE_FACES: "HIGH",
  SCREEN_SHARE_STOPPED: "HIGH",
  CAMERA_STOPPED: "HIGH",
  FULLSCREEN_EXIT: "MEDIUM",
  TAB_SWITCH: "MEDIUM",
  NO_FACE: "MEDIUM",
  FACE_DISAPPEARED: "MEDIUM",
  MICROPHONE_STOPPED: "MEDIUM",
  OBJECT_DETECTED: "HIGH",
  MOUTH_MOVING: "LOW",
  GAZE_AWAY: "LOW",
  VOICE_DETECTED: "LOW",
  SPEECH_VIOLATION: "MEDIUM",
  EXAM_STARTED: "LOW",
  EXAM_SUBMITTED: "LOW",
};

export const EVENT_LABELS: Record<string, string> = {
  MULTIPLE_FACES: "Multiple faces detected",
  NO_FACE: "No face detected",
  FACE_DISAPPEARED: "No face detected",
  TAB_SWITCH: "Tab switch detected",
  FULLSCREEN_EXIT: "Fullscreen exited",
  SCREEN_SHARE_STOPPED: "Screen sharing stopped",
  CAMERA_STOPPED: "Camera stopped",
  MICROPHONE_STOPPED: "Microphone stopped",
  OBJECT_DETECTED: "Prohibited object detected",
  MOUTH_MOVING: "Mouth movement detected",
  EXAM_STARTED: "Exam started",
  EXAM_SUBMITTED: "Assessment submitted",
};

export function severityFor(type: string): SeverityLabel {
  return EVENT_SEVERITY[type] ?? "MEDIUM";
}

export function labelFor(type: string): string {
  return EVENT_LABELS[type] ?? type.replaceAll("_", " ").toLowerCase();
}

export function isViolationType(type: string): boolean {
  return type !== "SESSION_RECORDING" && type !== "EXAM_STARTED" && type !== "EXAM_SUBMITTED";
}

export const BROWSER_EVENT_TYPES: IncidentType[] = [
  "TAB_SWITCH",
  "FULLSCREEN_EXIT",
  "SCREEN_SHARE_STOPPED",
  "CAMERA_STOPPED",
  "MICROPHONE_STOPPED",
];
