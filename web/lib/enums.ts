// Verbatim from server/src/routes/sessions.js lines 9-11. Any drift here
// produces a silent 400 on the detailed log form — do not edit without
// checking that file first.

export const COLORS = [
  "brown",
  "dark-brown",
  "green",
  "yellow",
  "pale",
  "black",
  "red",
] as const;
export type ColorValue = (typeof COLORS)[number];

export const COLOR_LABELS: Record<ColorValue, string> = {
  brown: "Brown (typical)",
  "dark-brown": "Dark brown",
  green: "Green",
  yellow: "Yellow",
  pale: "Pale / clay",
  black: "Black",
  red: "Red",
};

// Hex swatches for the SelectField colour dots — cosmetic only, not part of
// the wire contract.
export const COLOR_SWATCHES: Record<ColorValue, string> = {
  brown: "#8a5a34",
  "dark-brown": "#5a3a20",
  green: "#5f7a4f",
  yellow: "#c9a227",
  pale: "#d8cdb0",
  black: "#20201d",
  red: "#8a2e39",
};

export const ODORS = ["typical", "mild", "strong", "severe"] as const;
export type OdorValue = (typeof ODORS)[number];

export const ODOR_LABELS: Record<OdorValue, string> = {
  typical: "Typical",
  mild: "Milder than usual",
  strong: "Stronger than usual",
  severe: "Much stronger than usual",
};

export const PAIN_LEVELS = ["none", "mild", "moderate", "severe"] as const;
export type PainValue = (typeof PAIN_LEVELS)[number];

export const PAIN_LABELS: Record<PainValue, string> = {
  none: "None",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

// Client-side convention only — the server accepts any string array
// (filtered to strings, sliced to 10). These four are what the UI offers.
export const SYMPTOMS = [
  { value: "bloating", label: "Bloating" },
  { value: "urgency", label: "Urgency" },
  { value: "incomplete", label: "Incomplete evacuation" },
  { value: "cramping", label: "Cramping" },
] as const;
export type SymptomValue = (typeof SYMPTOMS)[number]["value"];

// Profile card banner themes — kept in sync with server/src/routes/profile.js
// BANNERS. Values are raw hex so the flex-card <canvas> export (which can't
// read CSS custom properties) can use them directly.
export const BANNERS = [
  { id: "sage", label: "Sage", from: "#3f5646", to: "#5f7f68" },
  { id: "claret", label: "Claret", from: "#5a1e26", to: "#8a2e39" },
  { id: "ink", label: "Ink", from: "#0b0908", to: "#3a332c" },
  { id: "gold", label: "Gilded", from: "#7a5a1e", to: "#c9a227" },
  { id: "rose", label: "Rose", from: "#7a3b46", to: "#c98a97" },
  { id: "slate", label: "Slate", from: "#33393f", to: "#6b7580" },
] as const;
export type BannerId = (typeof BANNERS)[number]["id"];

// The nine fixed badge ids from server/src/streak.js BADGES.
export const BADGE_IDS = [
  "milestone_first",
  "streak_7",
  "streak_30",
  "streak_100",
  "streak_365",
  "completeness_10",
  "completeness_50",
  "milestone_100_sessions",
  "milestone_first_photo",
] as const;
export type BadgeId = (typeof BADGE_IDS)[number];
