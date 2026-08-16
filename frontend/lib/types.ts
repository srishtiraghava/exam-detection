export type SessionStatus = "created" | "running" | "stopping" | "completed" | "failed";

export type IncidentType =
  | "FACE_DISAPPEARED"
  | "GAZE_AWAY"
  | "MOUTH_MOVING"
  | "MULTIPLE_FACES"
  | "OBJECT_DETECTED"
  | "VOICE_DETECTED"
  | "SPEECH_VIOLATION"
  | "SESSION_RECORDING";

export type IncidentStatus = "open" | "reviewed" | "dismissed" | "confirmed";

export type ReportStatus = "pending" | "ready" | "failed";

export type EventType =
  | "session.created"
  | "session.started"
  | "session.stopped"
  | "detection.status"
  | "violation.created"
  | "recording.started"
  | "recording.stopped"
  | "report.ready"
  | "evidence.created"
  | "error";

export interface CandidateSession {
  id: string;
  candidate_id: string;
  candidate_name: string;
  exam_id: string;
  exam_name: string | null;
  status: SessionStatus;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  config_overrides: Record<string, unknown>;
}

export interface DetectionStatus {
  session_id: string;
  face_present: boolean;
  gaze_direction: string;
  eye_ratio: number;
  mouth_moving: boolean;
  multiple_faces: boolean;
  objects_detected: boolean;
  audio_detected: boolean;
  error: string | null;
  timestamp: string;
}

export interface Evidence {
  id: string;
  kind: "image" | "video" | "audio" | "screen" | "report";
  path: string;
  created_at: string;
}

export interface Incident {
  id: string;
  session_id: string;
  type: IncidentType;
  severity: number;
  timestamp: string;
  status: IncidentStatus;
  metadata: Record<string, unknown>;
  evidence: Evidence[];
}

export interface Report {
  id: string;
  session_id: string;
  status: ReportStatus;
  path: string | null;
  created_at: string;
}

export interface RealtimeEvent {
  type: EventType;
  session_id: string | null;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface CreateSessionInput {
  candidate_id: string;
  candidate_name: string;
  exam_id: string;
  exam_name?: string;
}
