"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";

const WORD_GROUPS = ["Your data is yours. ", "The theatre ", "is ours."];

export default function ManifestoStatement() {
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-5 py-40 text-center md:px-10 md:py-56">
      <motion.div
        className="h-px w-20 bg-rule-strong"
        initial={{ clipPath: reduce ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        whileInView={{ clipPath: "inset(0 0% 0 0)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: reduce ? 0 : 0.6, ease: EASE.out }}
      />

      <h2 className="max-w-[24ch] font-display text-display text-ink-900">
        {WORD_GROUPS.map((group, i) => (
          <motion.span
            key={group}
            initial={{
              opacity: 0,
              y: reduce ? 0 : 8,
              filter: reduce ? "blur(0px)" : "blur(8px)",
            }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: reduce ? 0.2 : 0.8,
              delay: reduce ? 0 : i * 0.08,
              ease: EASE.out,
            }}
          >
            {group}
          </motion.span>
        ))}
      </h2>

      <p className="max-w-[52ch] text-lede text-ink-500">
        Photographs are deleted the moment the model has finished looking at
        them. Health data is never sold: not as a policy that could be
        revised, but as a constraint the product is built around. Everything we
        hold can be exported or destroyed on your instruction. The medals and
        the leaderboard are entertainment, and we would like you to enjoy
        them.
      </p>
    </section>
  );
}
