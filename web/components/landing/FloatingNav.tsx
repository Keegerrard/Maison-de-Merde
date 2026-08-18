"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import ArrowCTAButton from "@/components/ui/ArrowCTAButton";
import { EASE, DURATION, SPRING, STAGGER_STEP } from "@/lib/motion";

type SectionId = "systeme" | "cercle" | "journal";

const NAV_LINKS: { id: SectionId; label: string }[] = [
  { id: "systeme", label: "Le Système" },
  { id: "cercle", label: "Le Cercle" },
  { id: "journal", label: "Le Journal" },
];

const HOVER = "[@media(hover:hover)_and_(pointer:fine)]:hover";
const GROUP_HOVER = "[@media(hover:hover)_and_(pointer:fine)]:group-hover";

export default function FloatingNav() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReducedMotion = !!useReducedMotion();
  const firstOverlayLinkRef = useRef<HTMLAnchorElement | null>(null);

  const { scrollY } = useScroll();
  const pillScale = useTransform(scrollY, [0, 40], [1, 0.98]);
  const ringOpacity = useTransform(scrollY, [0, 40], [0, 1]);

  const barDuration = prefersReducedMotion ? 0.16 : 0.26;
  const overlayDuration = prefersReducedMotion ? 0.16 : DURATION.mobileNav;

  // Section-active tracking: a single IntersectionObserver over the three
  // anchor targets, never a scroll listener (plan §C.1 / gotcha 12).
  useEffect(() => {
    const elements = NAV_LINKS.map((link) => document.getElementById(link.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((best, entry) =>
          entry.intersectionRatio > best.intersectionRatio ? entry : best
        );
        setActiveSection(top.target.id as SectionId);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Body scroll lock + Escape-to-close while the mobile overlay is open.
  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstOverlayLinkRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const listVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: STAGGER_STEP,
        delayChildren: prefersReducedMotion ? 0 : 0.12,
      },
    },
  };

  const itemVariants: Variants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.2, ease: EASE.out } },
      }
    : {
        hidden: { opacity: 0, y: 48 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE.out } },
      };

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 ${
          mobileOpen ? "z-[60]" : "z-40"
        }`}
      >
        <motion.nav
          aria-label="Primary"
          style={{ scale: prefersReducedMotion ? 1 : pillScale }}
          className="pointer-events-auto relative mx-auto mt-6 flex w-max items-center gap-6 rounded-pill bg-paper-raised/80 py-1.5 pl-5 pr-1.5 shadow-ambient ring-1 ring-rule backdrop-blur-xl"
        >
          <motion.span
            aria-hidden
            style={{ opacity: ringOpacity }}
            className="pointer-events-none absolute inset-0 rounded-pill ring-1 ring-rule-strong"
          />

          <span className="relative font-display text-small tracking-[-0.01em] text-ink-900">
            Maison de Merde
          </span>

          <ul className="relative hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  aria-current={activeSection === link.id ? "true" : undefined}
                  className={`group relative inline-block text-small text-ink-700 transition-colors duration-[160ms] ease-out ${HOVER}:text-ink-900`}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-x-0 -bottom-1 h-px bg-ink-900 [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-[160ms] ease-out ${GROUP_HOVER}:[clip-path:inset(0_0%_0_0)]`}
                  />
                  {activeSection === link.id ? (
                    <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2">
                      <motion.span
                        layoutId="nav-dot"
                        transition={prefersReducedMotion ? { duration: 0 } : SPRING.layout}
                        className="block h-1 w-1 rounded-full bg-sage-600"
                      />
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>

          <div className="relative hidden md:block">
            <ArrowCTAButton href="/app/">Entrer</ArrowCTAButton>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="floating-nav-mobile-overlay"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className={`relative flex h-9 w-9 items-center justify-center rounded-pill ${HOVER}:bg-paper-sunk md:hidden`}
          >
            <span className="relative block h-4 w-[18px]">
              <motion.span
                aria-hidden
                animate={{ y: mobileOpen ? 0 : -4, rotate: mobileOpen ? 45 : 0 }}
                transition={{ duration: barDuration, ease: EASE.drawer }}
                className="absolute left-0 top-1/2 -mt-[0.75px] h-[1.5px] w-full rounded-full bg-ink-900"
              />
              <motion.span
                aria-hidden
                animate={{ y: mobileOpen ? 0 : 4, rotate: mobileOpen ? -45 : 0 }}
                transition={{ duration: barDuration, ease: EASE.drawer }}
                className="absolute left-0 top-1/2 -mt-[0.75px] h-[1.5px] w-full rounded-full bg-ink-900"
              />
            </span>
          </button>
        </motion.nav>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            id="floating-nav-mobile-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: overlayDuration, ease: EASE.drawer }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-12 bg-paper/[0.92] px-6 backdrop-blur-2xl"
          >
            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center gap-8"
            >
              {NAV_LINKS.map((link, index) => (
                <motion.li key={link.id} variants={itemVariants}>
                  <a
                    ref={index === 0 ? firstOverlayLinkRef : undefined}
                    href={`#${link.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-display text-ink-900"
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
              <motion.li variants={itemVariants}>
                <ArrowCTAButton href="/app/" onClick={() => setMobileOpen(false)}>
                  Entrer
                </ArrowCTAButton>
              </motion.li>
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
