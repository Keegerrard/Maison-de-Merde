import type { IconName } from "@/components/ui/Icon";

// Badge id -> Lucide icon + Roman numeral, replacing the server's emoji
// entirely. Verbatim from plan.md §D.5.
export const BADGE_ICON_MAP: Record<string, { icon: IconName; numeral: string }> = {
  milestone_first: { icon: "CircleDot", numeral: "I" },
  streak_7: { icon: "Flame", numeral: "VII" },
  streak_30: { icon: "Flame", numeral: "XXX" },
  streak_100: { icon: "Flame", numeral: "C" },
  streak_365: { icon: "Award", numeral: "CCCLXV" },
  completeness_10: { icon: "FileText", numeral: "X" },
  completeness_50: { icon: "FileText", numeral: "L" },
  milestone_100_sessions: { icon: "TrendingUp", numeral: "C" },
  milestone_first_photo: { icon: "Camera", numeral: "I" },
};

// Defensive fallback for a future backend badge id this map doesn't know
// about yet — degrades gracefully instead of crashing.
export function getBadgeIcon(id: string): { icon: IconName; numeral: string } {
  return BADGE_ICON_MAP[id] ?? { icon: "Circle", numeral: "?" };
}
