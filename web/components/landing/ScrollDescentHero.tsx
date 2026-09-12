"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { BRISTOL_HERO_BLURBS, BRISTOL_HEX, BRISTOL_PATHS } from "@/lib/bristol";
import ArrowCTAButton from "../ui/ArrowCTAButton";
import BristolLegendRail from "./BristolLegendRail";

const RIM_CX = 200;
const RIM_CY = 700;

// WebGL needs the browser; keep it out of the server bundle entirely and
// only pull it in on the client, after hydration.
const Toilet3DScene = dynamic(() => import("./Toilet3DScene"), {
  ssr: false,
  loading: () => null,
});

function CopyBlock({
  style,
}: {
  style?: { y: MotionValue<number>; opacity: MotionValue<number> };
}) {
  return (
    <motion.div
      style={style}
      className="relative z-20 flex max-w-[46ch] flex-col gap-6 text-left"
    >
      <span className="inline-flex w-fit items-center rounded-pill px-3 py-1 font-mono text-eyebrow uppercase text-ink-500 ring-1 ring-rule">
        Established 2026 · Purveyors of Fine Digestive Distinction
      </span>
      <h1 className="font-display text-[clamp(1.875rem,3.4vw,3.25rem)] leading-[0.98] tracking-[-0.02em] text-ink-900">
        A complete record of the one thing{" "}
        <span className="italic">you have never written down.</span>
      </h1>
      <p className="max-w-[42ch] text-lede text-ink-500">
        Maison de Merde is a longitudinal analytics platform for bowel
        movements, built on the Bristol Stool Scale. A minimal entry takes
        under ten seconds. The streak keeps you honest. The export is for
        your doctor.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <ArrowCTAButton href="/app/">Open the Register</ArrowCTAButton>
        <a
          href="#systeme"
          className="text-small font-medium text-ink-700 underline decoration-rule-strong decoration-1 underline-offset-4 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
        >
          Read the Methodology
        </a>
      </div>
    </motion.div>
  );
}

// Fills the dead air of the scroll morph with something to read: a hint
// before it starts, a one-line editorial note per Bristol type while it
// runs, and a closing line once the specimen has fully resolved and is
// shrinking away. Fixed min-height avoids layout shift as the three swap.
function HeroStageCopy({
  stage,
  activeIndex,
}: {
  stage: "intro" | "sequence" | "payoff";
  activeIndex: number;
}) {
  return (
    <div className="relative flex min-h-[2.75rem] w-full max-w-[300px] items-start justify-center text-center">
      <AnimatePresence mode="wait">
        {stage === "intro" ? (
          <motion.p
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-eyebrow uppercase tracking-[0.18em] text-ink-300"
          >
            Seven stages · scroll to see them all
          </motion.p>
        ) : stage === "payoff" ? (
          <motion.p
            key="payoff"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-small text-ink-700"
          >
            Seven types. One baseline. Now you know both.
          </motion.p>
        ) : (
          <motion.p
            key={activeIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-small text-ink-500"
          >
            {BRISTOL_HERO_BLURBS[activeIndex]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ScrollDescentHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  // Drives the copy alongside the legend rail (see HeroStageCopy below):
  // an opening hint before the morph starts, a per-type blurb during it, and
  // a closing line once the specimen has finished shrinking away. Without
  // this, roughly a fifth of the pinned scroll distance (once the sequence
  // reaches Type 7 but before the section releases) had nothing changing on
  // screen at all.
  const [stage, setStage] = useState<"intro" | "sequence" | "payoff">("intro");
  // The R3F canvas below defaults to a continuous render loop that runs
  // forever regardless of scroll position — including long after this
  // section has scrolled out of view, since React never unmounts it. Gate
  // it on actual visibility instead: frameloop flips to "never" the moment
  // the visual leaves the viewport, and back to "always" the moment it
  // returns, so the GPU/battery cost is paid only while there's something
  // to see.
  const [visualInView, setVisualInView] = useState(true);

  useEffect(() => {
    const node = visualRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisualInView(entry.isIntersecting),
      { rootMargin: "200px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx =
      v < 0.22 ? 0 : Math.min(6, Math.floor((v - 0.22) / 0.0943));
    setActiveIndex((prev) => (prev === idx ? prev : idx));

    const nextStage: "intro" | "sequence" | "payoff" =
      v < 0.2 ? "intro" : v >= 0.9 ? "payoff" : "sequence";
    setStage((prev) => (prev === nextStage ? prev : nextStage));
  });

  // Copy block: settles out of the way by p = 0.20.
  const copyY = useTransform(scrollYProgress, [0, 0.2], [0, -48]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  if (reduce) {
    return (
      <section className="relative min-h-[100dvh] w-full">
        <div className="mx-auto grid h-full w-full max-w-[1180px] grid-cols-1 items-center gap-12 px-5 py-28 md:grid-cols-2 md:px-10">
          <CopyBlock />
          <div className="flex flex-col items-center gap-8">
            <StaticPlate />
            <BristolLegendRail activeIndex={3} />
            <p className="max-w-[300px] text-center text-small text-ink-500">
              {BRISTOL_HERO_BLURBS[3]}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={heroRef} className="relative h-[220vh] md:h-[320vh]">
      <div className="sticky top-0 grid h-[100dvh] place-items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-8 px-5 md:grid-cols-2 md:px-10">
          <CopyBlock style={{ y: copyY, opacity: copyOpacity }} />

          <div className="relative mx-auto flex w-full max-w-[380px] flex-col items-center gap-3 md:max-w-none">
            <div
              ref={visualRef}
              className="relative aspect-[4/5] h-[42dvh] max-h-[380px] min-h-[240px] w-auto"
            >
              <Toilet3DScene
                progress={scrollYProgress}
                fallback={<StaticPlate />}
                inView={visualInView}
              />
            </div>

            <p className="font-mono text-eyebrow uppercase text-ink-300">
              Fig. 1. Aperture, plan view · Specimen descending · Bristol
              Types I-VII
            </p>

            <BristolLegendRail activeIndex={activeIndex} />
            <HeroStageCopy stage={stage} activeIndex={activeIndex} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StaticPlate() {
  return (
    <div
      className="relative aspect-[4/5] w-full max-w-[320px]"
      style={{ perspective: "900px" }}
    >
      <svg
        viewBox="0 0 400 900"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <ellipse
          cx={RIM_CX}
          cy={RIM_CY}
          rx={150}
          ry={46}
          fill="none"
          stroke="var(--ink-500)"
          strokeWidth={1.75}
        />
        <ellipse
          cx={RIM_CX}
          cy={RIM_CY}
          rx={118}
          ry={34}
          fill="none"
          stroke="var(--ink-300)"
          strokeWidth={1.5}
        />
        <ellipse
          cx={RIM_CX}
          cy={RIM_CY + 2}
          rx={108}
          ry={30}
          fill="var(--paper-sunk)"
        />
        <motion.g
          transform={`translate(${RIM_CX}, ${RIM_CY - 60})`}
          animate={{ opacity: [0.86, 1, 0.86] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={BRISTOL_PATHS[3]} fill={BRISTOL_HEX[3]} />
        </motion.g>
      </svg>
    </div>
  );
}
