// Motion tokens mirroring the CSS variables in app/globals.css (plan §B.7).
// Tailwind classes and Framer Motion props both draw from this one source.

export const EASE = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  drawer: [0.32, 0.72, 0, 1] as const,
};

export const DURATION = {
  press: 0.14,
  chip: 0.16,
  tabIndicator: 0.18,
  dropdown: 0.2,
  toastEnter: 0.32,
  toastExit: 0.2,
  modalEnter: 0.26,
  modalExit: 0.18,
  reveal: 0.7,
  mobileNav: 0.42,
};

export const SPRING = {
  settle: { type: "spring" as const, duration: 0.5, bounce: 0.2 },
  layout: { type: "spring" as const, duration: 0.4, bounce: 0 },
  drag: { type: "spring" as const, duration: 0.45, bounce: 0.15 },
};

export const STAGGER_STEP = 0.06;

export const SWIPE_VELOCITY_THRESHOLD = 0.11;
