"use client";

import { useEffect, useRef } from "react";

/**
 * Animates a numeral's textContent via requestAnimationFrame, never via
 * React state (a per-frame setState would re-render the whole tree). Attach
 * the returned ref to the element whose text should count up.
 */
export function useCountUp(value: number, durationMs = 500) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (from === to) {
      el.textContent = String(to);
      return;
    }
    if (to === 0) {
      el.textContent = "0";
      return;
    }

    let raf = 0;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      const current = Math.round(from + (to - from) * eased);
      if (el) el.textContent = String(current);
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return ref;
}
