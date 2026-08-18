"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { BRISTOL_COLORS, BRISTOL_LABELS, BRISTOL_PATHS } from "@/lib/bristol";
import { SPRING } from "@/lib/motion";

type Interaction = "pointer" | "keyboard";

// "Separate hard lumps" -> "Separate hard". Full label lives in `title`/
// aria-label for accessibility; the cell only has room for two words.
function shortLabel(full: string): string {
  return full.split(" ").slice(0, 2).join(" ").replace(/,$/, "");
}

/**
 * The app's signature control. Seven radio cells sharing one
 * `layoutId="bristol-selection"` highlight that springs between cells on
 * pointer interaction but jumps instantly on keyboard navigation (arrow
 * keys / Home / End) — keyboard actions get no animation, per the motion
 * framework in plan.md §D.2.
 */
export default function BristolPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const [focusIndex, setFocusIndex] = useState(value ? value - 1 : 0);
  const [interaction, setInteraction] = useState<Interaction>("pointer");
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusCell(index: number) {
    setFocusIndex(index);
    cellRefs.current[index]?.focus();
  }

  function handlePointerSelect(num: number) {
    setInteraction("pointer");
    onChange(value === num ? null : num);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const num = index + 1;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown": {
        e.preventDefault();
        const next = (index + 1) % 7;
        setInteraction("keyboard");
        onChange(next + 1);
        focusCell(next);
        break;
      }
      case "ArrowLeft":
      case "ArrowUp": {
        e.preventDefault();
        const prev = (index + 6) % 7;
        setInteraction("keyboard");
        onChange(prev + 1);
        focusCell(prev);
        break;
      }
      case "Home": {
        e.preventDefault();
        setInteraction("keyboard");
        onChange(1);
        focusCell(0);
        break;
      }
      case "End": {
        e.preventDefault();
        setInteraction("keyboard");
        onChange(7);
        focusCell(6);
        break;
      }
      case " ":
      case "Enter": {
        e.preventDefault();
        setInteraction("keyboard");
        onChange(value === num ? null : num);
        break;
      }
      default:
        break;
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Bristol Stool Type"
      className="grid grid-cols-4 gap-2 rounded-core-sm bg-paper-sunk p-2 ring-1 ring-rule md:grid-cols-7 md:gap-1.5 md:p-3"
    >
      {BRISTOL_PATHS.map((path, i) => {
        const num = i + 1;
        const selected = value === num;
        return (
          <button
            key={num}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Type ${num}: ${BRISTOL_LABELS[i]}`}
            title={BRISTOL_LABELS[i]}
            tabIndex={focusIndex === i ? 0 : -1}
            onFocus={() => setFocusIndex(i)}
            onClick={() => handlePointerSelect(num)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="group relative flex flex-col items-center justify-center gap-1 rounded-core-sm p-2 text-center transition-transform duration-[140ms] ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
          >
            {selected ? (
              <motion.div
                layoutId="bristol-selection"
                className="absolute inset-0 rounded-core-sm bg-paper-raised shadow-inner ring-2 ring-sage-600"
                transition={
                  interaction === "keyboard" ? { duration: 0 } : SPRING.layout
                }
              />
            ) : null}
            <span className="relative z-10 flex flex-col items-center gap-1">
              <svg
                viewBox="-130 -50 260 100"
                className="h-7 w-14 transition-transform duration-[160ms] ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-105"
                aria-hidden="true"
              >
                <path d={path} fill={BRISTOL_COLORS[i]} />
              </svg>
              <span className="font-display text-title leading-none text-ink-900">
                {num}
              </span>
              <span className="font-mono text-[9px] uppercase leading-tight tracking-[0.08em] text-ink-500">
                {shortLabel(BRISTOL_LABELS[i])}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
