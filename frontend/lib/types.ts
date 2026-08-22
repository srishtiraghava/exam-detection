export type SessionStatus = "created" | "running" | "stopping" | "completed" | "failed";

export type IncidentType =
  | "FACE_DISAPPEARED"
  | "NO_FACE"
  | "GAZE_AWAY"
  | "MOUTH_MOVING"
  | "MULTIPLE_FACES"
  | "OBJECT_DETECTED"
  | "VOICE_DETECTED"
  | "SPEECH_VIOLATION"
  | "SESSION_RECORDING"
  | "TAB_SWITCH"
  | "FULLSCREEN_EXIT"
  | "SCREEN_SHARE_STOPPED"
  | "CAMERA_STOPPED"
  | "MICROPHONE_STOPPED";

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

export type SeverityLabel = "LOW" | "MEDIUM" | "HIGH";

export type QuestionType = "mcq" | "coding";

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
  exam_answers?: Record<string, unknown>;
  exam_score?: number | null;
  risk_score?: number | null;
  duration_seconds?: number | null;
  mcq_correct?: number | null;
  mcq_total?: number | null;
  coding_passed?: boolean | null;
}

export interface DetectionStatus {
  session_id: string;
  face_present: boolean;
  face_count: number;
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

export interface McqQuestion {
  id: string;
  type: "mcq";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface CodingQuestionData {
  id: string;
  type: "coding";
  title: string;
  question: string;
  examples: { input: string; output: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export type ExamQuestion = McqQuestion | CodingQuestionData;

export interface ProctoringEvent {
  id: string;
  type: IncidentType | "EXAM_STARTED" | "EXAM_SUBMITTED";
  timestamp: string;
  severity: SeverityLabel;
  metadata: Record<string, unknown>;
  screenshotUrl?: string;
  evidenceId?: string;
}

export interface LocalEvidence {
  id: string;
  eventId: string;
  timestamp: string;
  type: IncidentType;
  imageUrl: string;
  faceCount?: number;
  severity: SeverityLabel;
}

export interface ExamSubmitPayload {
  answers: Record<string, number | string>;
  codingLanguage: string;
  codingSource: string;
  codingPassed: boolean;
  durationSeconds: number;
  events: ProctoringEvent[];
}

export interface ExamResults {
  session: CandidateSession;
  mcqCorrect: number;
  mcqTotal: number;
  codingPassed: boolean;
  score: number;
  percent: number;
  riskScore: number;
  riskLabel: SeverityLabel;
  durationSeconds: number;
  incidents: Incident[];
  topicScores: { topic: string; percent: number; correct: number; total: number }[];
  severityCounts: { HIGH: number; MEDIUM: number; LOW: number };
}
