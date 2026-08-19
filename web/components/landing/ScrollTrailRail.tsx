"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BRISTOL_HEX } from "@/lib/bristol";

// A quiet, whole-page companion to the hero's scroll morph: a hairline
// thread pinned to the left gutter with a small marker that travels its
// length as you scroll the entire document, cycling through the same
// Bristol ramp the hero specimen morphs through. Desktop only — on
// narrow viewports the gutter is too tight to spare for decoration.
export default function ScrollTrailRail() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const markerVh = useTransform(scrollYProgress, [0, 1], [6, 94]);
  const markerTransform = useTransform(
    markerVh,
    (v) => `translate(-50%, ${v}vh) translateY(-50%)`
  );
  const markerColor = useTransform(
    scrollYProgress,
    [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1],
    [...BRISTOL_HEX]
  );
  const railOpacity = useTransform(
    scrollYProgress,
    [0, 0.04, 0.96, 1],
    [0, 1, 1, 0]
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-5 z-20 hidden md:block md:left-10"
    >
      <div className="relative h-full w-px bg-rule" />
      {reduce ? null : (
        <motion.span
          className="absolute left-1/2 top-0 h-2 w-2 rounded-full shadow-[0_0_0_3px_var(--paper)]"
          style={{
            transform: markerTransform,
            backgroundColor: markerColor,
            opacity: railOpacity,
          }}
        />
      )}
    </div>
  );
}
