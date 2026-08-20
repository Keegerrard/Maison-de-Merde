import DoubleBezelCard from "@/components/ui/DoubleBezelCard";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import Rule from "@/components/ui/Rule";
import { BADGE_ICON_MAP, getBadgeIcon } from "@/lib/badgeIcons";
import { useLanguage } from "@/hooks/useLanguage";
import type { Badge } from "@/lib/types";

// One badge tile. The grid that lays these out lives in BadgeGrid.tsx.
export default function BadgeMedal({
  badge,
  delay = 0,
}: {
  badge: Badge;
  delay?: number;
}) {
  const { t, tBadge } = useLanguage();
  const unlocked = badge.unlocked;
  const known = Boolean(BADGE_ICON_MAP[badge.id]);
  const { icon, numeral } = getBadgeIcon(badge.id);
  const name = tBadge(badge.id, "name", badge.name);
  const desc = tBadge(badge.id, "desc", badge.desc);

  return (
    <Reveal delay={delay}>
      <DoubleBezelCard
        size="sm"
        className={[
          "group h-full",
          unlocked
            ? "!ring-sage-600/40 transition-transform duration-[260ms] ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-[3px]"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        coreClassName={unlocked ? "" : "!bg-paper-sunk"}
      >
        <div className="flex h-full flex-col gap-3">
          {unlocked ? (
            <Icon
              name={icon}
              size={28}
              strokeWidth={1}
              className="text-sage-700 transition-transform duration-[260ms] ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.06]"
            />
          ) : (
            <Icon name="Lock" size={28} strokeWidth={1} className="text-ink-500 opacity-40" />
          )}

          <p className={["font-display text-numeral leading-none text-ink-900", unlocked ? "" : "opacity-40"].join(" ")}>
            {numeral}
          </p>

          <p className={["font-display text-lede text-ink-900", unlocked ? "" : "opacity-40"].join(" ")}>
            {name}
            {!known ? (
              <span aria-hidden="true" className="ml-1">
                {badge.icon}
              </span>
            ) : null}
          </p>

          {/* Unlock condition stays fully legible even when locked. */}
          <p className="text-small text-ink-500">{desc}</p>

          {unlocked ? (
            <div className="mt-auto flex flex-col gap-2 pt-1">
              <Rule />
              <p className="font-mono text-eyebrow uppercase text-ink-500">{t("achievements.unlocked")}</p>
            </div>
          ) : null}
        </div>
      </DoubleBezelCard>
    </Reveal>
  );
}
