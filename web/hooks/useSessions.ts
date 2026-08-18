"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { SessionListResponse, SessionRow } from "@/lib/types";

/**
 * GET /api/sessions?limit=N — the recent-sessions feed for the Log tab.
 * Deliberately separate from useDashboard: the dashboard's single shared
 * fetch covers streak/heatmap/badges, but the session list is Log-tab-only
 * state that refreshes far more often (every log).
 */
export function useSessions(limit = 15) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SessionListResponse>(
        `/api/sessions?limit=${limit}`
      );
      setSessions(data.sessions);
    } catch {
      setError("Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, loading, error, refresh };
}
