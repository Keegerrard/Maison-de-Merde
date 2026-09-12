"use client";

import DoubleBezelCard from "../ui/DoubleBezelCard";
import EmptyState from "../ui/EmptyState";
import SectionHeading from "../ui/SectionHeading";
import PressButton from "../ui/PressButton";
import LeaderboardRow from "./LeaderboardRow";
import { useGlobalLeaderboard } from "@/hooks/useGlobalLeaderboard";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/hooks/useLanguage";

export default function GlobalLeaderboardPanel({
  onOpenChat,
  onOpenProfile,
}: {
  onOpenChat?: (username: string) => void;
  onOpenProfile?: () => void;
}) {
  const { t } = useLanguage();
  const { leaderboard, loading, error } = useGlobalLeaderboard();
  const { profile } = useProfile();

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow={t("global.eyebrow")}
        title={t("global.title")}
        lede={t("global.lede")}
      />

      {profile && !profile.isPublic ? (
        <DoubleBezelCard tone="signal">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-small text-ink-700">{t("global.notPublicHint")}</p>
            {onOpenProfile ? (
              <PressButton type="button" variant="secondary" onClick={onOpenProfile}>
                {t("profile.title")}
              </PressButton>
            ) : null}
          </div>
        </DoubleBezelCard>
      ) : null}

      {error ? (
        <DoubleBezelCard>
          <p className="text-small text-claret-600">{error}</p>
        </DoubleBezelCard>
      ) : loading ? (
        <DoubleBezelCard>
          <p className="text-small text-ink-500">{t("common.loading")}</p>
        </DoubleBezelCard>
      ) : (
        <DoubleBezelCard padding="none">
          <div className="divide-y divide-rule">
            {leaderboard.map((entry, index) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                rank={index + 1}
                index={index}
                onChat={!entry.isMe && onOpenChat ? () => onOpenChat(entry.username) : undefined}
              />
            ))}
          </div>
          {leaderboard.length === 1 ? (
            <div className="px-4 md:px-6">
              <EmptyState message={t("global.empty")} />
            </div>
          ) : null}
        </DoubleBezelCard>
      )}
    </div>
  );
}
