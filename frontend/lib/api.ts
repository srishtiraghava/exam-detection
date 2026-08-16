import type { CandidateSession, CreateSessionInput, DetectionStatus, Incident, Report } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
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
      body: JSON.stringify(input)
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
  }
};

export function mediaUrl(path: string) {
  const normalized = path.replace(/^\.\//, "");
  return `${API_BASE}/media/${encodeURIComponent(normalized)}`;
}

export function reportDownloadUrl(reportId: string) {
  return `${API_BASE}/reports/${reportId}/download`;
}
