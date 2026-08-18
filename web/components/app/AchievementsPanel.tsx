"use client";

import { motion, useReducedMotion } from "framer-motion";
import BadgeGrid from "./BadgeGrid";
import DoubleBezelCard from "@/components/ui/DoubleBezelCard";
import EyebrowTag from "@/components/ui/EyebrowTag";
import SkeletonBlock from "@/components/ui/SkeletonBlock";
import { useDashboard } from "@/hooks/useDashboard";
import { BADGE_IDS } from "@/lib/enums";
import { EASE } from "@/lib/motion";

export default function AchievementsPanel() {
  const { data, loading, error } = useDashboard();
  const reduceMotion = useReducedMotion();

  if (loading && !data) {
    return <SkeletonBlock className="h-64 w-full" />;
  }

  if (error && !data) {
    return (
      <DoubleBezelCard>
        <p className="text-body text-ink-500">
          Could not load your distinctions. Try again shortly.
        </p>
      </DoubleBezelCard>
    );
  }

  const badges = data?.badges ?? [];
  const total = BADGE_IDS.length;
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const progress = total > 0 ? unlockedCount / total : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <EyebrowTag>Les distinctions</EyebrowTag>
        <h2 className="font-display text-title text-ink-900">Nine distinctions.</h2>
        <p className="font-mono text-eyebrow uppercase text-ink-500">
          {unlockedCount} sur {total} obtenues
        </p>
        <div className="h-px w-full overflow-hidden bg-rule">
          <motion.div
            className="h-px w-full bg-sage-700"
            style={{ transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : { duration: 0.7, ease: EASE.out }
            }
          />
        </div>
      </div>

      <BadgeGrid badges={badges} />
    </div>
  );
}
