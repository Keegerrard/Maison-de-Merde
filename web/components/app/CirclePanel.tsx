"use client";

import { AnimatePresence } from "framer-motion";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import EmptyState from "../ui/EmptyState";
import SectionHeading from "../ui/SectionHeading";
import AddFriendField from "./AddFriendField";
import FriendRequestRow from "./FriendRequestRow";
import LeaderboardRow from "./LeaderboardRow";
import { useCircle } from "@/hooks/useCircle";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { FriendRequest } from "@/lib/types";

export default function CirclePanel() {
  const { leaderboard, requests, loading, error, refresh } = useCircle();
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

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
        eyebrow="LE CERCLE"
        title="Ranked on consistency."
        lede="Never on volume. Rewarding volume here would be irresponsible."
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
          <p className="text-small text-ink-500">Loading your circle…</p>
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
              />
            ))}
          </div>
          {leaderboard.length === 1 ? (
            <div className="px-4 md:px-6">
              <EmptyState message="A circle of one is still a circle. Add someone by name above." />
            </div>
          ) : null}
        </DoubleBezelCard>
      )}
    </div>
  );
}
