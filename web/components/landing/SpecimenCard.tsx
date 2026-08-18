import DoubleBezelCard from "@/components/ui/DoubleBezelCard";
import Rule from "@/components/ui/Rule";
import { BRISTOL_COLORS, BRISTOL_LABELS } from "@/lib/bristol";

const TAGS = ["brown", "typical", "no straining"];

export default function SpecimenCard() {
  return (
    <DoubleBezelCard
      tone="default"
      padding="default"
      className="md:-rotate-[1.5deg]"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-300">
            07:14 &middot; TUESDAY
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-mono text-eyebrow uppercase tracking-[0.22em] text-paper"
            style={{ backgroundColor: BRISTOL_COLORS[3] }}
          >
            04 &middot; {BRISTOL_LABELS[3]}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-pill bg-paper-sunk px-3.5 py-1.5 text-small text-ink-700 ring-1 ring-rule"
            >
              {tag}
            </span>
          ))}
        </div>

        <Rule />

        <p className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-300">
          ENTRY 0041 &middot; MAISON DE MERDE
        </p>
      </div>
    </DoubleBezelCard>
  );
}
