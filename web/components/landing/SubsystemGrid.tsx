import EditorialSplit from "@/components/ui/EditorialSplit";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import SubsystemCard from "./SubsystemCard";

// Mini-visual 01 — Logging Service: four stacked hairline session rows
// with mono timestamps and Bristol swatches. The top row enters on view.
const BRISTOL_SWATCH: Record<number, string> = {
  3: "bg-bristol-3",
  4: "bg-bristol-4",
  5: "bg-bristol-5",
};

function LoggingVisual() {
  const rows: { time: string; bristol: 3 | 4 | 5 }[] = [
    { time: "12 Aug · 14:20", bristol: 4 },
    { time: "11 Aug · 08:05", bristol: 3 },
    { time: "09 Aug · 21:40", bristol: 5 },
    { time: "08 Aug · 07:12", bristol: 4 },
  ];

  const row = (item: (typeof rows)[number], i: number) => (
    <div
      className={[
        "flex items-center justify-between gap-3",
        i === 0 ? "pb-2.5" : "border-t border-rule py-2.5",
      ].join(" ")}
    >
      <span className="font-mono text-eyebrow text-ink-500 transition-colors duration-[260ms] ease-out md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:text-sage-600">
        {item.time}
      </span>
      <span
        className={[
          "h-2.5 w-2.5 shrink-0 rounded-full",
          BRISTOL_SWATCH[item.bristol],
        ].join(" ")}
      />
    </div>
  );

  return (
    <div className="flex flex-col">
      {rows.map((item, i) =>
        i === 0 ? (
          <Reveal key={item.time} delay={0.15}>
            {row(item, i)}
          </Reveal>
        ) : (
          <div key={item.time}>{row(item, i)}</div>
        ),
      )}
    </div>
  );
}

// Mini-visual 02 — Streak & Rewards Engine: a hairline ring at 62% with
// a Flame glyph and the numeral 14 in display serif.
function StreakVisual() {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.62;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex items-center justify-center py-2">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="3"
            className="stroke-rule"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="stroke-sage-500 transition-colors duration-[260ms] ease-out md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:stroke-sage-600"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Icon name="Flame" size={16} className="text-ink-300" />
          <span className="font-display text-2xl text-ink-900">14</span>
        </div>
      </div>
    </div>
  );
}

// Mini-visual 03 — Social / Leaderboard Service: three leaderboard rows
// with mono ranks and streak figures; names replaced by redaction bars.
function LeaderboardVisual() {
  const rows = [
    { rank: "01", bar: "w-24", streak: "42d" },
    { rank: "02", bar: "w-20", streak: "31d" },
    { rank: "03", bar: "w-16", streak: "18d" },
  ];

  return (
    <div className="flex flex-col">
      {rows.map((item, i) => (
        <div
          key={item.rank}
          className={[
            "flex items-center gap-3",
            i === 0 ? "pb-2.5" : "border-t border-rule py-2.5",
          ].join(" ")}
        >
          <span className="w-5 shrink-0 font-mono text-small text-ink-300">
            {item.rank}
          </span>
          <span
            className={["h-2 shrink-0 rounded-pill bg-ink-300/30", item.bar].join(
              " ",
            )}
          />
          <span className="ml-auto font-mono text-eyebrow text-ink-500 transition-colors duration-[260ms] ease-out md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:text-sage-600">
            {item.streak}
          </span>
        </div>
      ))}
    </div>
  );
}

// Mini-visual 04 — Vision Analysis Service: a horizontal confidence
// gauge with a marked threshold at 0.40 and a needle resting just below it.
function VisionVisual() {
  const threshold = 0.4;
  const needle = 0.35;

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="relative h-1.5 rounded-pill bg-paper-deep">
        <span
          className="absolute inset-y-0 left-0 rounded-pill bg-ink-300/50"
          style={{ width: `${needle * 100}%` }}
        />
        <span
          className="absolute -top-1 h-3.5 w-px bg-ink-500"
          style={{ left: `${threshold * 100}%` }}
        />
        <span
          className="absolute -top-1.5 h-4 w-1.5 -translate-x-1/2 rounded-pill bg-ink-900 transition-colors duration-[260ms] ease-out md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-sage-600"
          style={{ left: `${needle * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between font-mono text-eyebrow text-ink-300">
        <span>0.00</span>
        <span className="text-ink-500">THRESHOLD 0.40</span>
        <span>1.00</span>
      </div>
    </div>
  );
}

const SUBSYSTEMS = [
  {
    index: "01",
    title: "Logging Service",
    description:
      "CRUD and sync. The only part of the system permitted to be boring.",
    visual: <LoggingVisual />,
    spanRows: true,
  },
  {
    index: "02",
    title: "Streak & Rewards Engine",
    description:
      "A per-user state machine. Increments on any day with an entry; consumes a grace token instead of resetting.",
    visual: <StreakVisual />,
    spanRows: false,
  },
  {
    index: "03",
    title: "Social / Leaderboard Service",
    description:
      "Ranks a circle on streak and consistency. Aggregate figures only. The details never leave your account.",
    visual: <LeaderboardVisual />,
    spanRows: false,
  },
  {
    index: "04",
    title: "Vision Analysis Service",
    description:
      "Asynchronous and queued. Withholds its answer entirely below 0.4 confidence.",
    visual: <VisionVisual />,
    spanRows: false,
  },
];

export default function SubsystemGrid() {
  return (
    <EditorialSplit
      rail={
        <SectionHeading
          eyebrow="FOUR SYSTEMS"
          title="Four services, one ledger."
          lede="The vision model is deliberately kept out of the critical path. A ten-second log must never wait on inference."
        />
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SUBSYSTEMS.map((subsystem, i) => (
          <Reveal
            key={subsystem.index}
            delay={i * 0.07}
            className={subsystem.spanRows ? "md:row-span-2" : ""}
          >
            <SubsystemCard
              index={subsystem.index}
              title={subsystem.title}
              description={subsystem.description}
              visual={subsystem.visual}
            />
          </Reveal>
        ))}
      </div>
    </EditorialSplit>
  );
}
