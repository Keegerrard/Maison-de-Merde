"use client";

import Modal from "../ui/Modal";
import PressButton from "../ui/PressButton";
import Icon from "../ui/Icon";
import PaperFlecks from "./PaperFlecks";
import { getBadgeIcon } from "@/lib/badgeIcons";
import { useLanguage } from "@/hooks/useLanguage";
import type { BadgeSummary } from "@/lib/types";

export default function CelebrationModal({
  badge,
  onDismiss,
}: {
  badge: BadgeSummary | null;
  onDismiss: () => void;
}) {
  const { t, tBadge } = useLanguage();
  const mapped = badge ? getBadgeIcon(badge.id) : null;
  const name = badge ? tBadge(badge.id, "name", badge.name) : "";
  const desc = badge ? tBadge(badge.id, "desc", badge.desc) : "";

  return (
    <Modal open={!!badge} onClose={onDismiss} title={t("celebration.title")}>
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
            {t("celebration.unlocked", { name })}
          </h2>
          <p className="text-small text-ink-500">{desc}</p>
          <PressButton onClick={onDismiss} className="mt-2">
            {t("celebration.ok")}
          </PressButton>
        </div>
      </div>
    </Modal>
  );
}
