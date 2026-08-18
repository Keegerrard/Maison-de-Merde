import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "var(--paper)",
          raised: "var(--paper-raised)",
          sunk: "var(--paper-sunk)",
          deep: "var(--paper-deep)",
        },
        ink: {
          900: "var(--ink-900)",
          700: "var(--ink-700)",
          500: "var(--ink-500)",
          300: "var(--ink-300)",
        },
        rule: "var(--rule)",
        "rule-strong": "var(--rule-strong)",
        sage: {
          700: "var(--sage-700)",
          600: "var(--sage-600)",
          500: "var(--sage-500)",
          200: "var(--sage-200)",
          100: "var(--sage-100)",
        },
        claret: {
          600: "var(--claret-600)",
          200: "var(--claret-200)",
          100: "var(--claret-100)",
        },
        bristol: {
          1: "var(--bristol-1)",
          2: "var(--bristol-2)",
          3: "var(--bristol-3)",
          4: "var(--bristol-4)",
          5: "var(--bristol-5)",
          6: "var(--bristol-6)",
          7: "var(--bristol-7)",
        },
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      fontSize: {
        hero: [
          "clamp(3.25rem, 9vw, 8.5rem)",
          { lineHeight: "0.92", letterSpacing: "-0.03em" },
        ],
        display: [
          "clamp(2.5rem, 5.5vw, 4.75rem)",
          { lineHeight: "0.96", letterSpacing: "-0.025em" },
        ],
        title: [
          "clamp(1.75rem, 2.6vw, 2.5rem)",
          { lineHeight: "1.06", letterSpacing: "-0.02em" },
        ],
        lede: [
          "clamp(1.0625rem, 1.35vw, 1.25rem)",
          { lineHeight: "1.55", letterSpacing: "-0.005em" },
        ],
        body: ["1rem", { lineHeight: "1.65" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        eyebrow: [
          "0.625rem",
          { lineHeight: "1", letterSpacing: "0.22em" },
        ],
        numeral: [
          "clamp(2.75rem, 6vw, 4.5rem)",
          { lineHeight: "0.9", letterSpacing: "-0.02em" },
        ],
      },
      borderRadius: {
        shell: "var(--r-shell)",
        core: "var(--r-core)",
        sm: "var(--r-sm)",
        "core-sm": "var(--r-core-sm)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        ambient: "var(--shadow-ambient)",
        inner: "var(--shadow-inner)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
