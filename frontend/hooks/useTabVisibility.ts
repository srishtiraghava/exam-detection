"use client";

import { useEffect, useRef } from "react";

export function useTabVisibility(enabled: boolean, onHidden?: () => void, onVisible?: () => void) {
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onChange = () => {
      const hidden = document.visibilityState === "hidden";
      if (hidden && !hiddenRef.current) {
        hiddenRef.current = true;
        onHidden?.();
      }
      if (!hidden && hiddenRef.current) {
        hiddenRef.current = false;
        onVisible?.();
      }
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [enabled, onHidden, onVisible]);
}
