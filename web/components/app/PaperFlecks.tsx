"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const FLECK_COLORS = [
  "var(--ink-700)",
  "var(--sage-600)",
  "var(--claret-600)",
  "var(--bristol-4)",
];

interface Fleck {
  id: number;
  left: number;
  top: number;
  dx: number;
  dy: number;
  rotate: number;
  color: string;
  delay: number;
}

function buildFlecks(): Fleck[] {
  return Array.from({ length: 26 }, (_, i) => ({
    id: i,
    left: 20 + Math.random() * 60,
    top: 10 + Math.random() * 30,
    dx: (Math.random() - 0.5) * 220,
    dy: 60 + Math.random() * 140,
    rotate: (Math.random() - 0.5) * 320,
    color: FLECK_COLORS[i % FLECK_COLORS.length],
    delay: Math.random() * 0.15,
  }));
}

/**
 * Bounded, in-modal celebratory flecks. Never full-viewport, never a
 * persistent canvas — replaces the old confetti canvas that caused a
 * blank-page regression (commit 13bb068) by staying inside the modal
 * panel's own `relative overflow-hidden` bounds and unmounting with it.
 */
export default function PaperFlecks() {
  const flecks = useMemo(buildFlecks, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {flecks.map((f) => (
        <motion.span
          key={f.id}
          className="absolute h-1.5 w-[6px] rounded-[1px]"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            backgroundColor: f.color,
          }}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: f.dx,
            y: f.dy,
            rotate: f.rotate,
          }}
          transition={{
            duration: 0.9,
            delay: f.delay,
            ease: [0.23, 1, 0.32, 1],
            times: [0, 0.15, 0.7, 1],
          }}
        />
      ))}
    </div>
  );
}
