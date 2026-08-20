"use client";

import Icon from "../ui/Icon";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import { useDashboard } from "@/hooks/useDashboard";
import { useCountUp } from "@/hooks/useCountUp";
import { useLanguage } from "@/hooks/useLanguage";

function StatCell({ label, value }: { label: string; value: number }) {
  const ref = useCountUp(value);
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-7 text-center">
      <span
        ref={ref}
        className="tabular font-display text-numeral text-ink-900"
      >
        {value}
      </span>
      <span className="font-mono text-eyebrow uppercase text-ink-500">
        {label}
      </span>
    </div>
  );
}

export default function StatTriad() {
  const { t } = useLanguage();
  const { data } = useDashboard();
  const current = data?.streak.current ?? 0;
  const longest = data?.streak.longest ?? 0;
  const grace = data?.graceTokens ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const frozen =
    !!data?.streakFreezeUntil && data.streakFreezeUntil >= today;

  return (
    <DoubleBezelCard padding="none">
      <div className="grid grid-cols-3 divide-x divide-rule">
        <div>
          <StatCell label={t("streak.current")} value={current} />
          {frozen && data?.streakFreezeUntil ? (
            <div className="-mt-3 flex items-center justify-center gap-1.5 pb-5 font-mono text-small text-sage-600">
              <Icon name="Snowflake" size={13} />
              <span>{t("streak.frozenUntil", { date: data.streakFreezeUntil })}</span>
            </div>
          ) : null}
        </div>
        <StatCell label={t("streak.record")} value={longest} />
        <StatCell label={t("streak.graceTokens")} value={grace} />
      </div>
    </DoubleBezelCard>
  );
}
