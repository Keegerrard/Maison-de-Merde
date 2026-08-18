"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE, DURATION, STAGGER_STEP } from "@/lib/motion";

/**
 * One hairline-ruled commitment: a mono label + a serif statement. The
 * hairline above the row draws itself in via `clip-path` on scroll entry,
 * staggered by `index`. Needs its own client-side motion (unlike
 * `CitationCard`), so this file — and only this file — is "use client".
 */
export default function CommitmentRow({
  label,
  statement,
  index = 0,
  className = "",
}: {
  label: string;
  statement: string;
  index?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const delay = reduce ? 0 : index * STAGGER_STEP;

  return (
    <div className={["relative pt-6 md:pt-7", className].filter(Boolean).join(" ")}>
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-rule"
        initial={{ clipPath: reduce ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        whileInView={{ clipPath: "inset(0 0% 0 0)" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: reduce ? 0 : 0.6, delay, ease: EASE.out }}
      />
      <motion.div
        className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,200px)_1fr] md:items-baseline md:gap-8"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{
          duration: reduce ? 0.2 : DURATION.reveal,
          delay,
          ease: EASE.out,
        }}
      >
        <span className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-500">
          {label}
        </span>
        <p className="font-display text-lede text-ink-900">{statement}</p>
      </motion.div>
    </div>
  );
}
