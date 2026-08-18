"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type {
  CircleResponse,
  FriendRequestsResponse,
  LeaderboardEntry,
  FriendRequest,
} from "@/lib/types";

export interface UseCircleResult {
  leaderboard: LeaderboardEntry[];
  requests: FriendRequest[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Fetches the leaderboard and pending friend requests in parallel — two
// independent endpoints that both drive the Circle tab.
export function useCircle(): UseCircleResult {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [circle, friendRequests] = await Promise.all([
        apiFetch<CircleResponse>("/api/circle"),
        apiFetch<FriendRequestsResponse>("/api/circle/requests"),
      ]);
      setLeaderboard(circle.leaderboard);
      setRequests(friendRequests.requests);
    } catch {
      setError("Failed to load your circle.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { leaderboard, requests, loading, error, refresh };
}
