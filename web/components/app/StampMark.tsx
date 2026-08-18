"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

// A letterpress-style confirmation stamp, replacing the old confetti-on-
// every-log burst (§D.2). Logging is a daily action; a quiet, spatially
// anchored stamp is the correct weight. Confetti is reserved for
// achievement unlocks elsewhere in the app.
//
// Enter: scale(1.55) opacity-0 -> scale(1) opacity-1 over 260ms.
// Hold: ~900ms.
// Fade: 200ms.
// Total ~1.36s, then `onDone` fires so the parent can unmount it.
export default function StampMark({ onDone }: { onDone?: () => void }) {
  return (
    <motion.div
      className="pointer-events-none absolute -top-2 right-4 z-10"
      initial={{ opacity: 0, scale: 1.55 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [1.55, 1, 1, 1] }}
      transition={{
        duration: 1.36,
        times: [0, 0.19, 0.85, 1],
        ease: EASE.out,
      }}
      onAnimationComplete={onDone}
    >
      <span
        className="inline-block rounded-pill bg-paper-raised px-3 py-1 font-mono text-eyebrow uppercase text-ink-700 ring-1 ring-rule-strong shadow-ambient"
        style={{ transform: "rotate(-8deg)" }}
      >
        Enregistré
      </span>
    </motion.div>
  );
}
