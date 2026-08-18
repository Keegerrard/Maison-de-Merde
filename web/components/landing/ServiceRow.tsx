export interface ServiceRowProps {
  index: string;
  frenchName: string;
  englishSubtitle: string;
  description: string;
  tags: string[];
  isLast?: boolean;
}

export default function ServiceRow({
  index,
  frenchName,
  englishSubtitle,
  description,
  tags,
  isLast = false,
}: ServiceRowProps) {
  return (
    <div
      className={[
        "group relative border-t border-rule py-8 md:py-10",
        isLast ? "border-b" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-sage-600 [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:[clip-path:inset(0_0_0_0)]"
      />
      <div className="grid grid-cols-1 gap-y-4 transition-transform duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-[6px] md:grid-cols-12 md:items-baseline md:gap-x-6">
        <div className="flex items-baseline gap-4 md:contents">
          <p className="font-mono text-title text-ink-300 transition-colors duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-sage-600 md:col-span-1">
            {index}
          </p>
          <div className="md:col-span-4">
            <p className="font-display text-title text-ink-900">{frenchName}</p>
            <p className="mt-1 font-mono text-eyebrow uppercase tracking-[0.12em] text-ink-500">
              {englishSubtitle}
            </p>
          </div>
        </div>
        <p className="text-body text-ink-700 md:col-span-5">{description}</p>
        <div className="flex flex-wrap items-start gap-2 md:col-span-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-pill px-2.5 py-1 font-mono text-eyebrow uppercase tracking-[0.1em] text-ink-500 ring-1 ring-rule"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
