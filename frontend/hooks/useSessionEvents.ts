"use client";

import { useEffect, useState } from "react";

import type { RealtimeEvent } from "@/lib/types";

const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";

export function useSessionEvents(sessionId: string) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(`${WS_BASE}/ws/sessions/${sessionId}`);

    socket.addEventListener("open", () => setConnected(true));
    socket.addEventListener("close", () => setConnected(false));
    socket.addEventListener("message", (message) => {
      const event = JSON.parse(message.data) as RealtimeEvent;
      setEvents((current) => [event, ...current].slice(0, 100));
    });

    return () => socket.close();
  }, [sessionId]);

  return { connected, events };
}
