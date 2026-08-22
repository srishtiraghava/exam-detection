import type {
  CandidateSession,
  CreateSessionInput,
  DetectionStatus,
  ExamResults,
  ExamSubmitPayload,
  Incident,
  ProctoringEvent,
  Report,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  createSession(input: CreateSessionInput) {
    return request<CandidateSession>("/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  listSessions() {
    return request<CandidateSession[]>("/sessions");
  },

  getSession(sessionId: string) {
    return request<CandidateSession>(`/sessions/${sessionId}`);
  },

  startSession(sessionId: string) {
    return request<CandidateSession>(`/sessions/${sessionId}/start`, { method: "POST" });
  },

  stopSession(sessionId: string) {
    return request<CandidateSession>(`/sessions/${sessionId}/stop`, { method: "POST" });
  },

  startExam(sessionId: string) {
    return request<CandidateSession>(`/sessions/${sessionId}/exam/start`, { method: "POST" });
  },

  submitExam(sessionId: string, payload: ExamSubmitPayload) {
    return request<ExamResults>(`/sessions/${sessionId}/submit`, {
      method: "POST",
      body: JSON.stringify({
        answers: payload.answers,
        coding_language: payload.codingLanguage,
        coding_source: payload.codingSource,
        coding_passed: payload.codingPassed,
        duration_seconds: payload.durationSeconds,
        events: payload.events,
      }),
    });
  },

  getResults(sessionId: string) {
    return request<ExamResults>(`/sessions/${sessionId}/results`);
  },

  sendProctoringEvent(sessionId: string, event: ProctoringEvent, screenshotBase64?: string) {
    return request<{ accepted: boolean }>(`/sessions/${sessionId}/proctoring-events`, {
      method: "POST",
      body: JSON.stringify({
        type: event.type,
        timestamp: event.timestamp,
        severity: event.severity,
        metadata: event.metadata,
        screenshot_base64: screenshotBase64,
      }),
    });
  },

  getStatus(sessionId: string) {
    return request<DetectionStatus>(`/sessions/${sessionId}/status`);
  },

  listIncidents(sessionId: string) {
    return request<Incident[]>(`/sessions/${sessionId}/incidents`);
  },

  createReport(sessionId: string) {
    return request<Report>(`/reports/sessions/${sessionId}`, { method: "POST" });
  },

  listReports(sessionId: string) {
    return request<Report[]>(`/reports/sessions/${sessionId}`);
  },
};

export function mediaUrl(path: string) {
  const normalized = path.replace(/^\.\//, "");
  return `${API_BASE}/media/${encodeURIComponent(normalized)}`;
}

export function reportDownloadUrl(reportId: string) {
  return `${API_BASE}/reports/${reportId}/download`;
}

export function framesWsUrl(sessionId: string) {
  const wsBase = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";
  return `${wsBase}/ws/sessions/${sessionId}/frames`;
}
