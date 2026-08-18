// One source of truth for the Bristol Stool Scale visual language, shared by
// the hero's scroll morph (ScrollDescentHero), the BristolPicker cells, and
// the BristolDistribution chart.

export const BRISTOL_LABELS: readonly [
  string, string, string, string, string, string, string
] = [
  "Separate hard lumps",
  "Lumpy sausage",
  "Cracked sausage",
  "Smooth, soft sausage",
  "Soft blobs",
  "Mushy, ragged",
  "Entirely liquid",
];

// A diverging ramp anchored at Type 4 (the clinically normal band), pulling
// toward dry clay for the constipated end (1-2) and washed amber for the
// loose end (6-7). See app/globals.css for the raw hex values.
export const BRISTOL_COLORS: readonly [
  string, string, string, string, string, string, string
] = [
  "var(--bristol-1)",
  "var(--bristol-2)",
  "var(--bristol-3)",
  "var(--bristol-4)",
  "var(--bristol-5)",
  "var(--bristol-6)",
  "var(--bristol-7)",
];

// Hex duplicates of the same ramp, for contexts (SVG fill attrs fed to
// Framer Motion's color interpolator) that can't resolve a CSS var at
// interpolation time.
export const BRISTOL_HEX: readonly [
  string, string, string, string, string, string, string
] = [
  "#C9B79A",
  "#B79E7C",
  "#A5875F",
  "#8E6C43",
  "#9C7C4E",
  "#B29066",
  "#C7A87F",
];

// Seven closed 4-anchor cubic paths (N -> E -> S -> W -> N), each generated
// from the same command template with only control-point numbers differing.
// HARD CONSTRAINT: every string below must have an identical command
// sequence and an identical count of numbers (26), or Framer Motion's `d`
// interpolation will snap between values instead of morphing. See
// scripts referenced in plan.md §B.9. Verified by assertBristolPathsMorphSafe()
// below, which runs once in development.
export const BRISTOL_PATHS: readonly [
  string, string, string, string, string, string, string
] = [
  "M 0 -34 C 5.44 -34 34 -5.44 34 0 C 34 5.44 5.44 34 0 34 C -5.44 34 -34 5.44 -34 0 C -34 -5.44 -5.44 -34 0 -34 Z",
  "M 0 -32 C 54 -32 75 -23.04 75 0 C 75 10.88 25.5 32 0 32 C -54 32 -75 23.04 -75 0 C -75 -10.88 -25.5 -32 0 -32 Z",
  "M 0 -30 C 42.9 -30 78 -16.5 78 0 C 78 7.2 18.72 30 0 30 C -42.9 30 -78 16.5 -78 0 C -78 -7.2 -18.72 -30 0 -30 Z",
  "M 0 -29 C 44 -29 80 -15.95 80 0 C 80 15.95 44 29 0 29 C -44 29 -80 15.95 -80 0 C -80 -15.95 -44 -29 0 -29 Z",
  "M 0 -42 C 41.8 -42 55 -31.92 55 0 C 55 16.8 22 42 0 42 C -41.8 42 -55 31.92 -55 0 C -55 -16.8 -22 -42 0 -42 Z",
  "M 0 -21 C 90 -21 100 -18.9 100 0 C 100 10.08 48 21 0 21 C -90 21 -100 18.9 -100 0 C -100 -10.08 -48 -21 0 -21 Z",
  "M 0 -13 C 48 -13 120 -5.2 120 0 C 120 5.2 48 13 0 13 C -48 13 -120 5.2 -120 0 C -120 -5.2 -48 -13 0 -13 Z",
];

// The seven scroll-progress stops the hero's morph is keyed to (plan §B.9).
export const MORPH_STOPS: readonly [
  number, number, number, number, number, number, number
] = [0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88];

function assertBristolPathsMorphSafe() {
  const numberPattern = /-?\d+(\.\d+)?/g;
  const structurePattern = /-?\d+(\.\d+)?/g;
  const counts = new Set(
    BRISTOL_PATHS.map((p) => (p.match(numberPattern) || []).length)
  );
  const shapes = new Set(
    BRISTOL_PATHS.map((p) => p.replace(structurePattern, "#"))
  );
  if (counts.size !== 1 || shapes.size !== 1) {
    throw new Error(
      "BRISTOL_PATHS have diverging command structure or number counts — " +
        "the scroll morph will snap instead of interpolating. Fix lib/bristol.ts."
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  assertBristolPathsMorphSafe();
}
