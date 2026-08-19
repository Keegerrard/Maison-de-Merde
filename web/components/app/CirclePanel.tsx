"use client";

import { AnimatePresence } from "framer-motion";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import EmptyState from "../ui/EmptyState";
import SectionHeading from "../ui/SectionHeading";
import AddFriendField from "./AddFriendField";
import FriendRequestRow from "./FriendRequestRow";
import LeaderboardRow from "./LeaderboardRow";
import { useCircle } from "@/hooks/useCircle";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { formatSessionTime } from "@/lib/format";
import type { FriendRequest, SharedSessionsResponse, SharedSessionRow } from "@/lib/types";

export default function CirclePanel({
  onOpenChat,
  onOpenSession,
}: {
  onOpenChat?: (username: string) => void;
  onOpenSession?: (id: number) => void;
}) {
  const { t } = useLanguage();
  const { leaderboard, requests, loading, error, refresh } = useCircle();
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [shared, setShared] = useState<SharedSessionRow[]>([]);

  useEffect(() => {
    apiFetch<SharedSessionsResponse>("/api/sessions/shared")
      .then((res) => setShared(res.sessions))
      .catch(() => setShared([]));
  }, []);

  async function handleAccept(request: FriendRequest) {
    setAcceptingId(request.id);
    try {
      await apiFetch<{ ok: true }>(
        `/api/circle/requests/${request.id}/accept`,
        { method: "POST" }
      );
      await refresh();
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow={t("circle.eyebrow")}
        title={t("circle.title")}
        lede={t("circle.lede")}
      />

      <DoubleBezelCard>
        <AddFriendField onAdded={refresh} />
      </DoubleBezelCard>

      {requests.length > 0 ? (
        <DoubleBezelCard>
          <ul className="flex flex-col divide-y divide-rule">
            <AnimatePresence initial={false}>
              {requests.map((request) => (
                <FriendRequestRow
                  key={request.id}
                  request={request}
                  accepting={acceptingId === request.id}
                  onAccept={handleAccept}
                />
              ))}
            </AnimatePresence>
          </ul>
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
              <EmptyState message={t("circle.empty")} />
            </div>
          ) : null}
        </DoubleBezelCard>
      )}

      <p className="font-display text-title text-ink-900">{t("circle.sharedWithYou")}</p>
      <DoubleBezelCard padding="none">
        {shared.length === 0 ? (
          <div className="px-4 md:px-6">
            <EmptyState message={t("circle.sharedEmpty")} />
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {shared.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onOpenSession?.(s.id)}
                className="flex w-full flex-col gap-1 px-4 py-4 text-left [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-sunk md:px-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-small font-medium text-ink-900">
                    {s.shared_by_username}
                  </span>
                  <span className="font-mono text-small text-ink-500">
                    {formatSessionTime(s.shared_at)}
                  </span>
                </div>
                {s.caption ? (
                  <p className="text-small italic text-ink-700">“{s.caption}”</p>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </DoubleBezelCard>
    </div>
  );
}
