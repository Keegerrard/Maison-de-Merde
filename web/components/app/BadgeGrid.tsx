import BadgeMedal from "./BadgeMedal";
import { BADGE_IDS } from "@/lib/enums";
import type { Badge } from "@/lib/types";

const STAGGER_STEP = 0.05;

// Renders the nine distinctions in the same fixed order as BADGE_IDS,
// regardless of the order the API happens to return them in.
export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  const byId = new Map(badges.map((badge) => [badge.id, badge]));
  const ordered = BADGE_IDS.map((id) => byId.get(id)).filter(
    (badge): badge is Badge => Boolean(badge)
  );

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {ordered.map((badge, index) => (
        <BadgeMedal key={badge.id} badge={badge} delay={index * STAGGER_STEP} />
      ))}
    </div>
  );
}
