import DoubleBezelCard from "@/components/ui/DoubleBezelCard";
import EyebrowTag from "@/components/ui/EyebrowTag";
import Icon from "@/components/ui/Icon";

/**
 * A single journal teaser. Presentational only — no hooks, no motion props.
 * Entrance staggering is owned by whatever wraps this (see
 * JournalTeaserGrid, which uses `Stagger`). The whole card is the link
 * target; the "Lire" affordance at the bottom is a label, not a second
 * interactive element.
 */
export default function JournalCard({
  href,
  kicker,
  title,
  standfirst,
  className = "",
}: {
  href: string;
  kicker: string;
  title: string;
  standfirst: string;
  className?: string;
}) {
  return (
    <DoubleBezelCard
      as="a"
      href={href}
      interactive
      className={["group block h-full", className].filter(Boolean).join(" ")}
      coreClassName="flex h-full flex-col gap-5"
    >
      <EyebrowTag className="w-fit">{kicker}</EyebrowTag>
      <h3 className="font-display text-title text-ink-900">{title}</h3>
      <p className="text-small text-ink-500">{standfirst}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 text-small font-medium text-ink-900">
        Lire
        <Icon
          name="ArrowRight"
          size={14}
          className="transition-transform duration-[160ms] ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-1"
        />
      </span>
    </DoubleBezelCard>
  );
}
