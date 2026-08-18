import DoubleBezelCard from "@/components/ui/DoubleBezelCard";
import Rule from "@/components/ui/Rule";

/**
 * A single, real, verifiable citation. Presentational only — no hooks, no
 * motion props. Entrance staggering is owned by whatever wraps this
 * component (see FoundationsWall, which uses `Stagger`).
 */
export default function CitationCard({
  index,
  authors,
  year,
  title,
  source,
  gloss,
  className = "",
}: {
  /** Footnote-style ordinal, e.g. "01". */
  index: string;
  authors: string;
  year: string;
  title: string;
  source: string;
  gloss: string;
  className?: string;
}) {
  return (
    <DoubleBezelCard className={className} padding="default">
      <div className="flex h-full flex-col gap-6">
        <span className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-500">
          Citation {index}
        </span>
        <p className="text-body text-ink-700">
          {authors} ({year}).{" "}
          <em className="font-display text-ink-900">{title}.</em>{" "}
          {source}
        </p>
        <Rule className="mt-auto" />
        <p className="font-display italic text-lede text-ink-900">
          &ldquo;{gloss}&rdquo;
        </p>
      </div>
    </DoubleBezelCard>
  );
}
