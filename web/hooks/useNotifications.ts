"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { NotificationItem, NotificationsResponse } from "@/lib/types";

const POLL_MS = 20000;

/**
 * One shared poll for the notification bell, active for the whole
 * authenticated session (started/stopped by AppShell, same lifecycle as
 * the dashboard fetch).
 */
export function useNotifications(active: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<NotificationsResponse>("/api/notifications");
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silent — the bell just won't update this cycle.
    }
  }, []);

  useEffect(() => {
    if (!active) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    refresh();
    timerRef.current = window.setInterval(refresh, POLL_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [active, refresh]);

  const markRead = useCallback(async (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
    } catch {
      /* best-effort */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await apiFetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      /* best-effort */
    }
  }, []);

  return { items, unreadCount, refresh, markRead, markAllRead };
}
