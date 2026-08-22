"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useExamTimer(durationSeconds: number, active: boolean, onExpire?: () => void) {
  const endAtRef = useRef<number | null>(null);
  const expiredRef = useRef(false);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [warnedFive, setWarnedFive] = useState(false);
  const [warnedOne, setWarnedOne] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    if (endAtRef.current === null) {
      endAtRef.current = Date.now() + durationSeconds * 1000;
    }

    const tick = () => {
      const endAt = endAtRef.current ?? Date.now();
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 300) {
        setWarnedFive(true);
      }
      if (next <= 60) {
        setWarnedOne(true);
      }
      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [active, durationSeconds, onExpire]);

  const elapsed = durationSeconds - remaining;
  const formatted = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  const stop = useCallback(() => {
    endAtRef.current = Date.now();
  }, []);

  return { remaining, elapsed, formatted, warnedFive, warnedOne, stop };
}
