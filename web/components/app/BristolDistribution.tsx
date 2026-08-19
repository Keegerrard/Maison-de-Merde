"use client";

import { motion } from "framer-motion";
import { useDashboard } from "@/hooks/useDashboard";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import EmptyState from "../ui/EmptyState";
import { BRISTOL_COLORS, BRISTOL_PATHS } from "@/lib/bristol";
import { EASE } from "@/lib/motion";

export default function BristolDistribution() {
  const { data } = useDashboard();
  const counts = data?.bristolCounts ?? [0, 0, 0, 0, 0, 0, 0];
  const max = counts.reduce((m, c) => Math.max(m, c), 0);
  const allZero = max === 0;

  return (
    <DoubleBezelCard>
      <p className="font-mono text-eyebrow uppercase text-ink-500">
        Bristol Scale
      </p>
      <h3 className="mb-6 mt-1 font-display text-title text-ink-900">
        Type distribution.
      </h3>

      <div className="flex flex-col gap-2.5">
        {counts.map((count, i) => {
          const ratio = max === 0 ? 0 : count / max;
          const isTypicalRow = i === 2 || i === 3;
          return (
            <div key={i}>
              <div
                className={[
                  "flex items-center gap-3 py-1",
                  isTypicalRow ? "border-l-2 border-sage-600 pl-2.5" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="w-4 shrink-0 font-display text-body text-ink-500">
                  {i + 1}
                </span>
                <svg
                  viewBox="-125 -45 250 90"
                  width={26}
                  height={11}
                  className="shrink-0"
                  aria-hidden
                >
                  <path d={BRISTOL_PATHS[i]} style={{ fill: BRISTOL_COLORS[i] }} />
                </svg>
                <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-paper-sunk">
                  <motion.div
                    className="h-full rounded-pill"
                    style={{
                      backgroundColor: BRISTOL_COLORS[i],
                      transformOrigin: "left",
                    }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: ratio }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.04, ease: EASE.out }}
                  />
                </div>
                <span className="tabular w-6 shrink-0 text-right font-mono text-small text-ink-700">
                  {count}
                </span>
              </div>
              {i === 3 ? (
                <p className="mb-1 mt-1 pl-9 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-sage-600">
                  Types 3–4 — typical range
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {allZero ? <EmptyState message="No typed entries yet." /> : null}
    </DoubleBezelCard>
  );
}
