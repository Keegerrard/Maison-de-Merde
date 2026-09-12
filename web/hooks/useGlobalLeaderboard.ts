"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { CircleResponse, LeaderboardEntry } from "@/lib/types";

export interface UseGlobalLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Mirrors useCircle's leaderboard half, against the opt-in global endpoint
// instead of the friends-only one. Same response shape (CircleResponse),
// so LeaderboardRow needs no changes to render either list.
export function useGlobalLeaderboard(): UseGlobalLeaderboardResult {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CircleResponse>("/api/circle/global");
      setLeaderboard(data.leaderboard);
    } catch {
      setError("Failed to load the global leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { leaderboard, loading, error, refresh };
}
