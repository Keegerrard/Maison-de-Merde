"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const FRAME_COUNT = 145;
const framePath = (n: number) => `/splash-frames/frame_${String(n).padStart(3, "0")}.webp`;

let scrollTriggerRegistered = false;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return reduced;
}

// Treats a data-saver request or a measured slow connection the same as
// prefers-reduced-motion: skip the ~5MB / 145-frame download and the
// scroll-scrub entirely, fall back to a single static frame. This is a
// deliberate alternative to guessing "mobile == turn it off" — a phone on
// fast wifi still gets the full scene, while a laptop tethered to a bad
// connection gets the same courtesy a phone would. navigator.connection is
// Chromium-only; browsers without it just always return false here, which
// is the safe default (full experience, same as today).
function usePrefersLightweightMedia() {
  const [lightweight, setLightweight] = useState(false);

  useEffect(() => {
    type NetworkInformation = {
      saveData?: boolean;
      effectiveType?: string;
      addEventListener?: (type: "change", cb: () => void) => void;
      removeEventListener?: (type: "change", cb: () => void) => void;
    };
    const connection = (navigator as Navigator & { connection?: NetworkInformation })
      .connection;
    if (!connection) return;

    const SLOW_TYPES = new Set(["slow-2g", "2g"]);
    function evaluate() {
      setLightweight(
        Boolean(connection?.saveData) || SLOW_TYPES.has(connection?.effectiveType ?? "")
      );
    }

    evaluate();
    connection.addEventListener?.("change", evaluate);
    return () => connection.removeEventListener?.("change", evaluate);
  }, []);

  return lightweight;
}

export default function SplashHeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameIndexRef = useRef(0);
  const drawnIndexRef = useRef(-1);
  // Tracks real viewport visibility so the render loop can be fully stopped
  // rather than merely hidden — see the IntersectionObserver effect below.
  const inViewRef = useRef(true);
  const reducedMotion = usePrefersReducedMotion();
  const lightweightMedia = usePrefersLightweightMedia();
  const reduce = reducedMotion || lightweightMedia;
  const [ready, setReady] = useState(false);

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

    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !ctx) return;

    if (!scrollTriggerRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      scrollTriggerRegistered = true;
    }

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resizeCanvas() {
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
      // React never unmounts this section once the page scrolls past it, so
      // without this check the loop would otherwise keep ticking forever in
      // the background. Only reschedule while actually in view; the
      // IntersectionObserver below restarts the chain on re-entry.
      if (inViewRef.current) {
        raf = requestAnimationFrame(draw);
      }
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    raf = requestAnimationFrame(draw);

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          const wasInView = inViewRef.current;
          inViewRef.current = entry.isIntersecting;
          if (entry.isIntersecting && !wasInView) {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(draw);
          }
        },
        { rootMargin: "200px 0px" }
      );
      observer.observe(section);
    }

    const ctx2 = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          frameIndexRef.current = Math.min(
            FRAME_COUNT - 1,
            Math.max(0, Math.round(self.progress * (FRAME_COUNT - 1)))
          );

          // Wordmark resolves only in the final quarter of the pin, once the
          // specimen has settled, rather than tracking scroll linearly.
          const reveal = gsap.utils.clamp(0, 1, (self.progress - 0.72) / 0.24);
          if (wordmarkRef.current) {
            gsap.set(wordmarkRef.current, {
              opacity: reveal,
              y: (1 - reveal) * 10,
            });
          }
        },
      });
    }, section);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resizeCanvas);
      observer?.disconnect();
      ctx2.revert();
    };
  }, [reduce]);

  if (reduce) {
    return (
      <section className="relative w-full bg-paper-deep">
        <div className="relative mx-auto aspect-[16/9] w-full max-w-[1600px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={framePath(FRAME_COUNT)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-10">
            <span className="font-display text-title text-ink-900">Maison de Merde</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[240vh] bg-paper-deep">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full transition-opacity duration-500"
          style={{ opacity: ready ? 1 : 0 }}
        />
        <div
          ref={wordmarkRef}
          className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center opacity-0 md:bottom-20"
        >
          <span className="font-display text-title tracking-[-0.01em] text-ink-900">
            Maison de Merde
          </span>
        </div>
      </div>
    </section>
  );
}
