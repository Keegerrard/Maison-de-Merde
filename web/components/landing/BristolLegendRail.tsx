import { motion } from "framer-motion";
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
              {active ? (
                <motion.span
                  key={activeIndex}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "backOut" }}
                  className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-sage-600"
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Mobile: single-line strip showing only the active type, plus a
          "0X / 07" fraction and a dot-progress row — on desktop the full
          seven-row list above already communicates progress, but the mobile
          strip previously showed only the current label with no sense of
          how much of the sequence remains. */}
      <div className="flex flex-col items-center gap-2.5 md:hidden">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="flex items-baseline gap-2 font-mono text-small"
        >
          <span className="text-ink-500">
            {String(activeIndex + 1).padStart(2, "0")} / 07
          </span>
          <span className="text-ink-700">{BRISTOL_LABELS[activeIndex]}</span>
        </motion.div>
        <div className="flex items-center gap-1.5">
          {BRISTOL_LABELS.map((label, i) => (
            <span
              key={label}
              className={[
                "h-1.5 rounded-full transition-all duration-300 ease-out",
                i === activeIndex ? "w-4 bg-sage-600" : "w-1.5 bg-rule-strong",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </>
  );
}
