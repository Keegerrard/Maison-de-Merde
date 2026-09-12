/* =========================================================================
   REFERENCE ONLY — not imported anywhere, not part of the build.

   This is the pre-merge "tunnel descent" landing section that got dropped
   when the dark-mode-redesign PR was merged on 2026-09-10 (replaced by
   SplashHeroSection in web/app/page.tsx). Kept here as a working reference
   for whoever rebuilds this scene with new frame art — the parts worth
   stealing are the scroll-scrub mechanics, not the specific frames:

   - Sticky/pinned 300vh scroll section driving a frame index off
     scrollYProgress (useScroll + useMotionValueEvent), no state re-render
     per scroll tick — the frame index lives in a ref and a rAF loop reads it.
   - Cover-fit draw math for blitting a source image onto a canvas of an
     arbitrary aspect ratio (the scale = Math.max(cw/w, ch/h) trick).
   - DPR-aware canvas sizing capped at 2x, re-computed on resize.
   - A prefers-reduced-motion fallback that renders the final static frame
     instead of the scrub, rather than just disabling the whole section.

   The original expected 145 frames at web/public/tunnel-frames/frame_NNN.webp
   (3-digit zero-padded, e.g. frame_001.webp .. frame_145.webp), ~34KB each,
   ~4.9MB total — that asset folder is gone and was not restored. Whatever
   replaces this will need its own frame export (or reconsider the canvas
   approach entirely — a compressed <video> with scroll-driven currentTime
   scrubbing is a lighter alternative worth considering for a rebuild, see
   the perf discussion this file's removal came out of).
   ========================================================================= */

"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import EyebrowTag from "@/components/ui/EyebrowTag";

const FRAME_COUNT = 145;
const framePath = (n: number) => `/tunnel-frames/frame_${String(n).padStart(3, "0")}.webp`;

function TunnelCaption({ light = false }: { light?: boolean }) {
  return (
    <>
      <EyebrowTag className={light ? "!text-paper !ring-paper/25" : undefined}>
        Section II · Transit
      </EyebrowTag>
      <p
        className={
          "max-w-[38ch] font-display text-title " + (light ? "text-paper" : "text-ink-900")
        }
      >
        The distance is longer than you think.
      </p>
    </>
  );
}

export default function TunnelDescentSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameIndexRef = useRef(0);
  const drawnIndexRef = useRef(-1);
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    frameIndexRef.current = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(v * (FRAME_COUNT - 1))));
  });

  useEffect(() => {
    if (reduce) return;

    let cancelled = false;
    let loaded = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i += 1) {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i);
      img.onload = () => {
        loaded += 1;
        if (loaded === FRAME_COUNT && !cancelled) setReady(true);
      };
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      cancelled = true;
    };
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      canvas!.width = Math.round(parent.clientWidth * dpr);
      canvas!.height = Math.round(parent.clientHeight * dpr);
      drawnIndexRef.current = -1;
    }

    function draw() {
      const idx = frameIndexRef.current;
      if (idx !== drawnIndexRef.current) {
        const img = imagesRef.current[idx];
        if (img && img.complete && img.naturalWidth > 0) {
          const cw = canvas!.width;
          const ch = canvas!.height;
          const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;
          ctx!.clearRect(0, 0, cw, ch);
          ctx!.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
          drawnIndexRef.current = idx;
        }
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduce]);

  if (reduce) {
    return (
      <section className="relative w-full bg-black">
        <div className="relative mx-auto aspect-[16/9] w-full max-w-[1600px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={framePath(FRAME_COUNT)} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start gap-3 px-5 py-10 md:px-10">
          <TunnelCaption />
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[300vh] bg-black">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full transition-opacity duration-500"
          style={{ opacity: ready ? 1 : 0 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 px-5 pb-16 md:px-10 md:pb-20">
          <TunnelCaption light />
        </div>
      </div>
    </section>
  );
}
