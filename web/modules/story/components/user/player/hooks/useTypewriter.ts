// modules/story/components/user/play/hooks/useTypewriter.ts
// ─────────────────────────────────────────────────────────────────────────────
// BUG FIXED: The original hook received (narrativePhase, speed, enabled) but
// was typed as (text: string, ...). The phase enum ("pre" | "main" | "post")
// was passed as the text — so the typewriter typed the word "pre" then stopped.
//
// The hook must receive the ACTUAL TEXT to type. The caller (StoryPlayPage) is
// responsible for resolving which narrative text corresponds to the current phase
// and passing that resolved string here.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";

export function useTypewriter(
  /** The resolved text string to type out */
  text: string,
  /** Characters per second — default 18 */
  speed = 18,
  /** When false, display the full text immediately (skip animation) */
  enabled = true,
) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  // Store interval ref so we can clear on skip without stale closure issues
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    clearTimer();

    // Empty or disabled → show immediately
    if (!text) {
      setDisplayed("");
      setDone(true);
      return;
    }

    if (!enabled) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    // Reset for new text
    setDisplayed("");
    setDone(false);

    let i = 0;

    intervalRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearTimer();
        setDone(true);
      }
    }, 1000 / speed); // speed = chars/sec

    return clearTimer;
  }, [text, speed, enabled]);

  // Skip: jump to end immediately without waiting for the interval
  const skip = useCallback(() => {
    clearTimer();
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}