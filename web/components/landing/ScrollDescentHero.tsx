"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { BRISTOL_HEX, BRISTOL_PATHS, MORPH_STOPS } from "@/lib/bristol";
import ArrowCTAButton from "../ui/ArrowCTAButton";
import BristolLegendRail from "./BristolLegendRail";
import BristolMorphPath from "./BristolMorphPath";

const RIM_CX = 200;
const RIM_CY = 700;
const SPECIMEN_START_Y = 210;

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
        Établie 2026 · Purveyors of Fine Digestive Distinction
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
        <ArrowCTAButton href="/app/">Ouvrir le registre</ArrowCTAButton>
        <a
          href="#systeme"
          className="text-small font-medium text-ink-700 underline decoration-rule-strong decoration-1 underline-offset-4 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
        >
          Lire la méthodologie
        </a>
      </div>
    </motion.div>
  );
}

export default function ScrollDescentHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx =
      v < 0.22 ? 0 : Math.min(6, Math.floor((v - 0.22) / 0.0943));
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  });

  // Copy block: settles out of the way by p = 0.20.
  const copyY = useTransform(scrollYProgress, [0, 0.2], [0, -48]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Rim draw-in.
  const rimPathLength = useTransform(scrollYProgress, [0.02, 0.14], [0, 1]);
  const rimOpacity = useTransform(scrollYProgress, [0.02, 0.14], [0, 1]);

  // Lid: closed -> open -> closed, as a full transform string.
  const lidDeg = useTransform(
    scrollYProgress,
    [0, 0.06, 0.16, 0.94, 1],
    [0, 0, -104, -104, 0]
  );
  const lidTransform = useTransform(lidDeg, (d) => `rotateX(${d}deg)`);

  // Specimen: appear, descend, morph, fade.
  const specimenOpacity = useTransform(
    scrollYProgress,
    [0.16, 0.22, 0.9, 0.94],
    [0, 1, 1, 0]
  );
  const specimenScale = useTransform(
    scrollYProgress,
    [0.16, 0.22, 0.88],
    [0.86, 0.92, 1]
  );
  const specimenTy = useTransform(scrollYProgress, [0.22, 0.88], [-40, 560]);
  const specimenRotateDeg = useTransform(scrollYProgress, [0.22, 0.88], [-6, 8]);
  const specimenTransform = useTransform(() => {
    return `translateY(${specimenTy.get()}px) rotate(${specimenRotateDeg.get()}deg) scale(${specimenScale.get()})`;
  });
  const morphStopsArr = [...MORPH_STOPS];
  const morphedD = useTransform(scrollYProgress, morphStopsArr, [...BRISTOL_PATHS]);
  const morphedFill = useTransform(scrollYProgress, morphStopsArr, [...BRISTOL_HEX]);

  // Ripples on contact.
  const rippleAScale = useTransform(scrollYProgress, [0.88, 0.94], [0.4, 1.6]);
  const rippleAOpacity = useTransform(scrollYProgress, [0.88, 0.94], [1, 0]);
  const rippleATransform = useTransform(rippleAScale, (s) => `scale(${s})`);
  const rippleBScale = useTransform(
    scrollYProgress,
    [0.895, 0.955],
    [0.4, 1.6]
  );
  const rippleBOpacity = useTransform(scrollYProgress, [0.895, 0.955], [1, 0]);
  const rippleBTransform = useTransform(rippleBScale, (s) => `scale(${s})`);

  // Plate wrapper settles as the lid closes.
  const plateOpacity = useTransform(scrollYProgress, [0.94, 1], [1, 0.35]);
  const plateBlur = useTransform(scrollYProgress, [0.94, 1], [0, 3]);
  const plateFilter = useTransform(plateBlur, (b) => `blur(${b}px)`);

  if (reduce) {
    return (
      <section className="relative min-h-[100dvh] w-full">
        <div className="mx-auto grid h-full w-full max-w-[1180px] grid-cols-1 items-center gap-12 px-5 py-28 md:grid-cols-2 md:px-10">
          <CopyBlock />
          <div className="flex flex-col items-center gap-8">
            <StaticPlate />
            <BristolLegendRail activeIndex={3} />
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
              className="relative aspect-[4/5] h-[42dvh] max-h-[380px] min-h-[240px] w-auto"
              style={{ perspective: "900px" }}
            >
              <svg
                viewBox="0 0 400 900"
                className="absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <motion.ellipse
                  cx={RIM_CX}
                  cy={RIM_CY}
                  rx={150}
                  ry={46}
                  fill="none"
                  stroke="var(--rule-strong)"
                  strokeWidth={1}
                  style={{ pathLength: rimPathLength, opacity: rimOpacity }}
                />
                <motion.ellipse
                  cx={RIM_CX}
                  cy={RIM_CY}
                  rx={118}
                  ry={34}
                  fill="none"
                  stroke="var(--rule)"
                  strokeWidth={1}
                  style={{ pathLength: rimPathLength, opacity: rimOpacity }}
                />
                <ellipse
                  cx={RIM_CX}
                  cy={RIM_CY + 2}
                  rx={108}
                  ry={30}
                  fill="var(--paper-sunk)"
                />

                <g transform={`translate(${RIM_CX}, ${SPECIMEN_START_Y})`}>
                  <motion.g
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "50% 50%",
                      transform: specimenTransform,
                      opacity: specimenOpacity,
                    }}
                  >
                    <BristolMorphPath d={morphedD} fill={morphedFill} />
                  </motion.g>
                </g>

                <motion.ellipse
                  cx={RIM_CX}
                  cy={RIM_CY + 2}
                  rx={60}
                  ry={17}
                  fill="none"
                  stroke="var(--rule-strong)"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "50% 50%",
                    transform: rippleATransform,
                    opacity: rippleAOpacity,
                  }}
                />
                <motion.ellipse
                  cx={RIM_CX}
                  cy={RIM_CY + 2}
                  rx={60}
                  ry={17}
                  fill="none"
                  stroke="var(--rule)"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "50% 50%",
                    transform: rippleBTransform,
                    opacity: rippleBOpacity,
                  }}
                />
              </svg>

              <motion.div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  transformOrigin: "50% 78%",
                  transform: lidTransform,
                  opacity: plateOpacity,
                  filter: plateFilter,
                }}
              >
                <svg
                  viewBox="0 0 400 900"
                  className="h-full w-full overflow-visible"
                >
                  <path
                    d={`M ${RIM_CX - 150} ${RIM_CY}
                        C ${RIM_CX - 150} ${RIM_CY - 46} ${RIM_CX + 150} ${RIM_CY - 46} ${RIM_CX + 150} ${RIM_CY}
                        C ${RIM_CX + 150} ${RIM_CY + 46} ${RIM_CX - 150} ${RIM_CY + 46} ${RIM_CX - 150} ${RIM_CY} Z`}
                    fill="var(--paper-raised)"
                    stroke="var(--rule-strong)"
                    strokeWidth={1}
                  />
                  <path
                    d={`M ${RIM_CX - 140} ${RIM_CY}
                        C ${RIM_CX - 140} ${RIM_CY - 40} ${RIM_CX + 140} ${RIM_CY - 40} ${RIM_CX + 140} ${RIM_CY}`}
                    fill="none"
                    stroke="var(--rule)"
                    strokeWidth={1}
                  />
                </svg>
              </motion.div>
            </div>

            <p className="font-mono text-eyebrow uppercase text-ink-300">
              Fig. 1 — Aperture, plan view · Specimen descending · Bristol
              Types I–VII
            </p>

            <BristolLegendRail activeIndex={activeIndex} />
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
          stroke="var(--rule-strong)"
          strokeWidth={1}
        />
        <ellipse
          cx={RIM_CX}
          cy={RIM_CY}
          rx={118}
          ry={34}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={1}
        />
        <ellipse
          cx={RIM_CX}
          cy={RIM_CY + 2}
          rx={108}
          ry={30}
          fill="var(--paper-sunk)"
        />
        <g transform={`translate(${RIM_CX}, ${RIM_CY - 60})`}>
          <path d={BRISTOL_PATHS[3]} fill={BRISTOL_HEX[3]} />
        </g>
      </svg>
    </div>
  );
}
