// src/hooks/useInactivityLogout.ts

import { useEffect, useRef, useCallback } from "react";

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "inactivity_timeout_minutes";
const DEFAULT_TIMEOUT_MINUTES = 30;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
];

// ─── Helpers (exportados para uso na página de Config) ────────────────────────

export function getInactivityTimeout(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_TIMEOUT_MINUTES;
  const parsed = parseInt(stored, 10);
  return isNaN(parsed) || parsed <= 0 ? DEFAULT_TIMEOUT_MINUTES : parsed;
}

export function setInactivityTimeout(minutes: number): void {
  localStorage.setItem(STORAGE_KEY, String(minutes));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInactivityLogout(onLogout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const ms = getInactivityTimeout() * 60 * 1000;

    timerRef.current = setTimeout(() => {
      onLogout();
    }, ms);
  }, [onLogout]);

  useEffect(() => {
    resetTimer();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [resetTimer]);
}