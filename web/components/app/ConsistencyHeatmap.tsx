"use client";

import { useMemo } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import Reveal from "../ui/Reveal";

// Cell geometry, in SVG user units.
const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;

// Sequential single-hue ramp for count data (not the Bristol diverging
// scale — this has no meaningful midpoint).
const LEVEL_COLORS = [
  "var(--paper-deep)",
  "var(--sage-200)",
  "var(--sage-500)",
  "var(--sage-700)",
];

function levelFor(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.33) return 1;
  if (ratio <= 0.66) return 2;
  return 3;
}

interface Cell {
  day: string;
  count: number;
  row: number;
  col: number;
  level: number;
}

export default function ConsistencyHeatmap() {
  const { data } = useDashboard();
  const entries = data?.heatmap ?? [];

  const { cells, columns } = useMemo(() => {
    if (entries.length === 0) return { cells: [] as Cell[], columns: 0 };

    // GitHub-style week bucketing: entry 0 (the oldest day) lands in row
    // `rowOffset` (its own UTC day-of-week, 0=Sunday..6=Saturday). Every
    // entry after it is exactly one calendar day later, so its row is
    // simply (index + rowOffset) mod 7, and the week-column increments
    // every time that sum crosses a multiple of 7 (i.e. wraps Sat -> Sun).
    const rowOffset = new Date(`${entries[0].day}T00:00:00Z`).getUTCDay();
    const maxCount = entries.reduce((m, e) => Math.max(m, e.count), 0);

    const built: Cell[] = entries.map((entry, i) => {
      const slot = i + rowOffset;
      return {
        day: entry.day,
        count: entry.count,
        row: slot % 7,
        col: Math.floor(slot / 7),
        level: levelFor(entry.count, maxCount),
      };
    });

    const columns = built.reduce((m, c) => Math.max(m, c.col), 0) + 1;
    return { cells: built, columns };
  }, [entries]);

  const width = Math.max(columns * STEP - GAP, CELL);
  const height = 7 * STEP - GAP;

  return (
    <DoubleBezelCard className="h-full" coreClassName="flex h-full flex-col gap-5">
      <div>
        <p className="font-mono text-eyebrow uppercase text-ink-500">
          Régularité
        </p>
        <h3 className="mt-1 font-display text-title text-ink-900">
          Les 91 derniers jours.
        </h3>
      </div>

      <Reveal className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          style={{ minWidth: Math.max(width, 260), display: "block" }}
          role="img"
          aria-label="Contribution heatmap of sessions over the last 91 days"
        >
          {cells.map((c) => (
            <rect
              key={c.day}
              x={c.col * STEP}
              y={c.row * STEP}
              width={CELL}
              height={CELL}
              rx={3}
              style={{ fill: LEVEL_COLORS[c.level] }}
              aria-label={`${c.day}: ${c.count} session(s)`}
            >
              <title>{`${c.day}: ${c.count} session(s)`}</title>
            </rect>
          ))}
        </svg>
      </Reveal>

      <div className="mt-auto flex items-center gap-2 font-mono text-small text-ink-500">
        <span>Moins</span>
        {LEVEL_COLORS.map((color) => (
          <span
            key={color}
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>Plus</span>
      </div>
    </DoubleBezelCard>
  );
}
