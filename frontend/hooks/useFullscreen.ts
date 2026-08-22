"use client";

import { useCallback, useEffect, useState } from "react";

export function useFullscreen(enabled: boolean, onExit?: () => void) {
  const [active, setActive] = useState(false);

  const request = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setActive(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setActive(isFull);
      if (enabled && !isFull) {
        onExit?.();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [enabled, onExit]);

  return { active, request };
}
