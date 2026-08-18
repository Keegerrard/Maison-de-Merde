import { BRISTOL_LABELS } from "@/lib/bristol";

export default function BristolLegendRail({
  activeIndex,
}: {
  activeIndex: number;
}) {
  return (
    <>
      {/* Desktop: seven stacked rows, leader rule draws in on the active row. */}
      <ol className="hidden flex-col gap-3 font-mono text-small md:flex">
        {BRISTOL_LABELS.map((label, i) => {
          const active = i === activeIndex;
          return (
            <li
              key={label}
              className={[
                "flex items-center gap-3 transition-opacity duration-200 ease-out",
                active ? "opacity-100" : "opacity-[0.28]",
              ].join(" ")}
            >
              <span className="text-ink-500">{String(i + 1).padStart(2, "0")}</span>
              <span
                className={[
                  "h-px w-8 bg-rule-strong transition-[clip-path] duration-[320ms] ease-out",
                  active
                    ? "[clip-path:inset(0_0_0_0)]"
                    : "[clip-path:inset(0_100%_0_0)]",
                ].join(" ")}
              />
              <span className="text-ink-700">{label}</span>
            </li>
          );
        })}
      </ol>

      {/* Mobile: single-line strip showing only the active type. */}
      <div className="flex items-baseline gap-2 font-mono text-small md:hidden">
        <span className="text-ink-500">
          {String(activeIndex + 1).padStart(2, "0")}
        </span>
        <span className="text-ink-700">{BRISTOL_LABELS[activeIndex]}</span>
      </div>
    </>
  );
}
