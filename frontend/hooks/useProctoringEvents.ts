"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { EVENT_COOLDOWN_MS, isViolationType, severityFor } from "@/lib/proctoring";
import type { Incident, IncidentType, LocalEvidence, ProctoringEvent } from "@/lib/types";

export function useProctoringEvents() {
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [evidence, setEvidence] = useState<LocalEvidence[]>([]);
  const activeRef = useRef<Record<string, number>>({});
  const lastEmittedRef = useRef<Record<string, number>>({});

  const addEvent = useCallback(
    (type: ProctoringEvent["type"], metadata: Record<string, unknown> = {}, screenshotUrl?: string) => {
      const now = Date.now();
      const last = lastEmittedRef.current[type] ?? 0;
      if (now - last < EVENT_COOLDOWN_MS) {
        return null;
      }
      if (activeRef.current[type]) {
        return null;
      }
      lastEmittedRef.current[type] = now;
      activeRef.current[type] = now;
      const event: ProctoringEvent = {
        id: crypto.randomUUID(),
        type,
        timestamp: new Date().toISOString(),
        severity: severityFor(type),
        metadata,
        screenshotUrl,
      };
      setEvents((current) => [event, ...current]);
      return event;
    },
    [],
  );

  const clearActive = useCallback((type: string) => {
    delete activeRef.current[type];
  }, []);

  const attachEvidence = useCallback((item: LocalEvidence) => {
    setEvidence((current) => [item, ...current]);
  }, []);

  const ingestIncident = useCallback((incident: Incident) => {
    const type = incident.type as IncidentType;
    setEvents((current) => {
      if (current.some((item) => item.id === incident.id)) {
        return current;
      }
      const recent = current.some(
        (item) => item.type === type && Date.now() - new Date(item.timestamp).getTime() < EVENT_COOLDOWN_MS,
      );
      if (recent) {
        return current;
      }
      const mapped: ProctoringEvent = {
        id: incident.id,
        type,
        timestamp: incident.timestamp,
        severity: severityFor(type),
        metadata: incident.metadata,
      };
      return [mapped, ...current];
    });
  }, []);

  const violationCount = useMemo(
    () => events.filter((event) => isViolationType(event.type)).length,
    [events],
  );

  return {
    events,
    evidence,
    violationCount,
    addEvent,
    clearActive,
    attachEvidence,
    ingestIncident,
    latestEvent: events[0] ?? null,
  };
}
