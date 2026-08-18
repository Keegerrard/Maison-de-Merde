"use client";

import Modal from "../ui/Modal";
import PressButton from "../ui/PressButton";
import Icon from "../ui/Icon";
import PaperFlecks from "./PaperFlecks";
import { getBadgeIcon } from "@/lib/badgeIcons";
import type { BadgeSummary } from "@/lib/types";

export default function CelebrationModal({
  badge,
  onDismiss,
}: {
  badge: BadgeSummary | null;
  onDismiss: () => void;
}) {
  const mapped = badge ? getBadgeIcon(badge.id) : null;

  return (
    <Modal open={!!badge} onClose={onDismiss} title="Achievement unlocked">
      <div className="relative overflow-hidden">
        {badge ? <PaperFlecks /> : null}
        <div className="relative flex flex-col items-center gap-3 text-center">
          {mapped ? (
            <Icon
              name={mapped.icon}
              size={40}
              strokeWidth={1}
              className="text-sage-700"
            />
          ) : null}
          {mapped?.numeral ? (
            <span className="font-display text-title text-ink-500">
              {mapped.numeral}
            </span>
          ) : null}
          <h2 className="font-display text-title text-ink-900">
            {badge?.name} obtenue
          </h2>
          <p className="text-small text-ink-500">{badge?.desc}</p>
          <PressButton onClick={onDismiss} className="mt-2">
            Bien.
          </PressButton>
        </div>
      </div>
    </Modal>
  );
}
