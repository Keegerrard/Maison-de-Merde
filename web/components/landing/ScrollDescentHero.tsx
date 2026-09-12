"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  BRISTOL_HERO_BLURBS,
  BRISTOL_HEX,
  BRISTOL_LABELS,
  BRISTOL_PATHS,
  MORPH_STOPS,
} from "@/lib/bristol";
import ArrowCTAButton from "../ui/ArrowCTAButton";

// Readonly tuples from lib/bristol.ts spread into plain mutable arrays —
// same pattern Toilet3DScene used for MORPH_STOPS — because Framer Motion's
// useTransform wants a regular array, not a readonly tuple.
const MORPH_STOPS_ARR = [...MORPH_STOPS];
const BRISTOL_PATHS_ARR = [...BRISTOL_PATHS];
const BRISTOL_HEX_ARR = [...BRISTOL_HEX];

// The scroll morph previously lived inside a 3D toilet-bowl scene: the
// bowl's own geometry ended up occluding the specimen partway through (its
// rim curls inward, and from the fixed camera angle that overhangs anything
// below the rim line), and no amount of material tweaking made it read as
// "a proper toilet" rather than a rendering glitch. Replaced entirely with
// a flat, hand-authored SVG path — a winding tube evoking the intestine's
// own switchback shape — that the specimen visibly travels down while
// morphing through the same seven BRISTOL_PATHS/BRISTOL_HEX shapes as
// before. No 3D, no camera, no occlusion possible: the specimen is drawn
// directly on top of the tube, always.
//
// Nine waypoints: an entry point at the very top, one per Bristol type
// (matching MORPH_STOPS 1:1), and an exit point at the bottom.
const LANE_LEFT = 120;
const LANE_RIGHT = 280;
const LANE_CENTER = 200;
const ROW_HEIGHT = 140;
// Half the tube's stroke width (96), so the rounded caps at the very top
// and bottom of the path don't get clipped by the viewBox edge.
const PATH_PADDING = 60;

const WAYPOINTS: { x: number; y: number }[] = [
  { x: LANE_CENTER, y: 0 },
  { x: LANE_LEFT, y: ROW_HEIGHT * 1 },
  { x: LANE_RIGHT, y: ROW_HEIGHT * 2 },
  { x: LANE_LEFT, y: ROW_HEIGHT * 3 },
  { x: LANE_RIGHT, y: ROW_HEIGHT * 4 },
  { x: LANE_LEFT, y: ROW_HEIGHT * 5 },
  { x: LANE_RIGHT, y: ROW_HEIGHT * 6 },
  { x: LANE_LEFT, y: ROW_HEIGHT * 7 },
  { x: LANE_CENTER, y: ROW_HEIGHT * 8 },
].map((p) => ({ x: p.x, y: p.y + PATH_PADDING }));

const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = ROW_HEIGHT * 8 + PATH_PADDING * 2;

const TUBE_PATH = WAYPOINTS.map(
  (p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
).join(" ");

// Matches the 9 WAYPOINTS: scroll start, the 7 MORPH_STOPS, scroll end.
const WAYPOINT_PROGRESS = [0, ...MORPH_STOPS_ARR, 1];
const WAYPOINT_X = WAYPOINTS.map((p) => p.x);
const WAYPOINT_Y = WAYPOINTS.map((p) => p.y);

// BRISTOL_PATHS shapes run up to radius ~120 (Type 7) around their own
// origin — scaled down so the widest shape still sits comfortably inside
// the tube's stroke width (96) rather than spilling past its walls.
const SPECIMEN_SCALE = 0.32;

function IntestineVisual({
  scrollYProgress,
  activeIndex,
}: {
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  activeIndex: number;
}) {
  const specimenX = useTransform(scrollYProgress, WAYPOINT_PROGRESS, WAYPOINT_X);
  const specimenY = useTransform(scrollYProgress, WAYPOINT_PROGRESS, WAYPOINT_Y);
  const specimenPath = useTransform(scrollYProgress, MORPH_STOPS_ARR, BRISTOL_PATHS_ARR);
  const specimenColor = useTransform(scrollYProgress, MORPH_STOPS_ARR, BRISTOL_HEX_ARR);
  const specimenOpacity = useTransform(
    scrollYProgress,
    [0, 0.04, 0.96, 1],
    [0, 1, 1, 0]
  );

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      className="h-[70dvh] max-h-[760px] w-auto shrink-0"
      role="img"
      aria-label={`A specimen travels through a winding channel, currently showing Bristol Type ${activeIndex + 1}: ${BRISTOL_LABELS[activeIndex]}.`}
    >
      {/* Two nested strokes on the same centerline path is the standard flat
          way to fake a tube: the wider one is the wall, the narrower one on
          top is the (theme-aware) interior. */}
      <path
        d={TUBE_PATH}
        fill="none"
        stroke="var(--rule-strong)"
        strokeWidth={96}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={TUBE_PATH}
        fill="none"
        stroke="var(--paper-sunk)"
        strokeWidth={78}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <motion.g style={{ x: specimenX, y: specimenY, opacity: specimenOpacity }}>
        <motion.path
          d={specimenPath}
          fill={specimenColor}
          transform={`scale(${SPECIMEN_SCALE})`}
        />
      </motion.g>
    </svg>
  );
}

function HeroIntro() {
  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-6 px-5 py-28 text-center md:px-10 md:py-40">
      <span className="inline-flex w-fit items-center rounded-pill px-3 py-1 font-mono text-eyebrow uppercase text-ink-500 ring-1 ring-rule">
        Established 2026 · Purveyors of Fine Digestive Distinction
      </span>
      <h1 className="font-display text-[clamp(2rem,4.2vw,3.5rem)] leading-[0.98] tracking-[-0.02em] text-ink-900">
        A complete record of the one thing{" "}
        <span className="italic">you have never written down.</span>
      </h1>
      <p className="max-w-[52ch] text-lede text-ink-500">
        Maison de Merde is a longitudinal analytics platform for bowel
        movements, built on the Bristol Stool Scale. A minimal entry takes
        under ten seconds. The streak keeps you honest. The export is for
        your doctor.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <ArrowCTAButton href="/app/">Open the Register</ArrowCTAButton>
        <a
          href="#systeme"
          className="text-small font-medium text-ink-700 underline decoration-rule-strong decoration-1 underline-offset-4 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
        >
          Read the Methodology
        </a>
      </div>
    </section>
  );
}

const TITLE_LINE = (activeIndex: number) => (
  <>
    {String(activeIndex + 1).padStart(2, "0")} / 07 — {BRISTOL_LABELS[activeIndex]}
  </>
);

// Per-stage copy flanking the tube on desktop (title left, detail right);
// combined into one stacked block below it on mobile, where there's no room
// for three columns. Each `side` renders its own independent content for a
// given stage — no shared fallback branch, so there's no risk of the same
// line appearing twice across columns.
function StageCopy({
  stage,
  activeIndex,
  side,
}: {
  stage: "intro" | "sequence" | "payoff";
  activeIndex: number;
  side: "left" | "right" | "mobile";
}) {
  const alignClass =
    side === "left"
      ? "items-end text-right"
      : side === "right"
        ? "items-start text-left"
        : "items-center text-center";

  let content: ReactNode = null;
  let key = `${side}-empty`;

  if (stage === "intro") {
    if (side === "right" || side === "mobile") {
      key = "intro";
      content = (
        <p className="font-mono text-eyebrow uppercase tracking-[0.18em] text-ink-300">
          Seven stages · scroll to follow it down
        </p>
      );
    }
  } else if (stage === "payoff") {
    if (side === "right" || side === "mobile") {
      key = "payoff";
      content = (
        <p className="text-small text-ink-700">
          Seven types. One baseline. Now you know both.
        </p>
      );
    }
  } else if (side === "left") {
    key = `title-${activeIndex}`;
    content = (
      <p className="font-mono text-eyebrow uppercase tracking-[0.14em] text-ink-500">
        {TITLE_LINE(activeIndex)}
      </p>
    );
  } else if (side === "right") {
    key = `detail-${activeIndex}`;
    content = <p className="text-small text-ink-500">{BRISTOL_HERO_BLURBS[activeIndex]}</p>;
  } else {
    // mobile: title + detail together, since there's only one slot.
    key = `mobile-${activeIndex}`;
    content = (
      <>
        <p className="font-mono text-eyebrow uppercase tracking-[0.14em] text-ink-500">
          {TITLE_LINE(activeIndex)}
        </p>
        <p className="text-small text-ink-500">{BRISTOL_HERO_BLURBS[activeIndex]}</p>
      </>
    );
  }

  return (
    <div
      className={[
        "flex min-h-[3rem] w-full max-w-[280px] flex-col justify-center gap-1",
        alignClass,
      ].join(" ")}
    >
      <AnimatePresence mode="wait">
        {content ? (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={["flex flex-col gap-1", alignClass].join(" ")}
          >
            {content}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function ScrollDescentHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [stage, setStage] = useState<"intro" | "sequence" | "payoff">("intro");

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.max(0, Math.min(6, Math.round((v - 0.22) / 0.11)));
    setActiveIndex((prev) => (prev === idx ? prev : idx));

    const nextStage: "intro" | "sequence" | "payoff" =
      v < 0.05 ? "intro" : v >= 0.93 ? "payoff" : "sequence";
    setStage((prev) => (prev === nextStage ? prev : nextStage));
  });

  if (reduce) {
    return (
      <>
        <HeroIntro />
        <section className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-5 pb-28 md:px-10">
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="h-[60dvh] max-h-[600px] w-auto"
            role="img"
            aria-label="A diagram of a specimen at Bristol Type 4, resting in a winding channel."
          >
            <path
              d={TUBE_PATH}
              fill="none"
              stroke="var(--rule-strong)"
              strokeWidth={96}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={TUBE_PATH}
              fill="none"
              stroke="var(--paper-sunk)"
              strokeWidth={78}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g transform={`translate(${WAYPOINTS[4].x}, ${WAYPOINTS[4].y}) scale(${SPECIMEN_SCALE})`}>
              <path d={BRISTOL_PATHS[3]} fill={BRISTOL_HEX[3]} />
            </g>
          </svg>
          <p className="max-w-[300px] text-center text-small text-ink-500">
            {String(4).padStart(2, "0")} / 07 — {BRISTOL_LABELS[3]}
            <br />
            {BRISTOL_HERO_BLURBS[3]}
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <HeroIntro />
      <section ref={heroRef} className="relative h-[260vh] md:h-[360vh]">
        <div className="sticky top-0 grid h-[100dvh] place-items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-6 px-5 md:grid-cols-[1fr_auto_1fr] md:gap-4 md:px-10">
            <div className="hidden md:flex md:justify-end">
              <StageCopy stage={stage} activeIndex={activeIndex} side="left" />
            </div>

            <div className="flex flex-col items-center gap-4">
              <IntestineVisual scrollYProgress={scrollYProgress} activeIndex={activeIndex} />
              <div className="md:hidden">
                <StageCopy stage={stage} activeIndex={activeIndex} side="mobile" />
              </div>
            </div>

            <div className="hidden md:flex md:justify-start">
              <StageCopy stage={stage} activeIndex={activeIndex} side="right" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
