"use client";

import Icon from "../ui/Icon";
import { useDashboard } from "@/hooks/useDashboard";
import { useCountUp } from "@/hooks/useCountUp";
import { useLanguage } from "@/hooks/useLanguage";

export default function StreakPill() {
  const { t } = useLanguage();
  const { data, loading } = useDashboard();
  const current = data?.streak.current ?? 0;
  const frozen =
    !!data?.streakFreezeUntil &&
    data.streakFreezeUntil >= new Date().toISOString().slice(0, 10);
  const countRef = useCountUp(current);

  return (
    <div
      className="flex items-center gap-2 rounded-pill bg-paper-sunk px-3.5 py-2 ring-1 ring-rule"
      title={
        frozen && data?.streakFreezeUntil
          ? t("streak.frozenUntil", { date: data.streakFreezeUntil })
          : undefined
      }
    >
      <Icon
        name={frozen ? "Snowflake" : "Flame"}
        size={15}
        className={frozen ? "text-sage-600" : "text-claret-600"}
      />
      <span
        ref={countRef}
        className="tabular font-mono text-small font-medium text-ink-900"
      >
        {loading ? "0" : current}
      </span>
      <span className="hidden font-mono text-eyebrow uppercase text-ink-300 sm:inline">
        {t("streak.days")}
      </span>
    </div>
  );
}
