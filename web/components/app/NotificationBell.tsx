"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../ui/Icon";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/hooks/useLanguage";
import { SPRING } from "@/lib/motion";
import type { NotificationItem } from "@/lib/types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function notifCopy(n: NotificationItem, t: (k: string) => string): string {
  const username = typeof n.payload.username === "string" ? n.payload.username : "Someone";
  switch (n.type) {
    case "friend_request":
      return `${username} ${t("notif.friendRequest")}`;
    case "friend_accept":
      return `${username} ${t("notif.friendAccept")}`;
    case "message":
      return `${username} ${t("notif.message")}`;
    case "session_shared":
      return `${username} ${t("notif.sessionShared")}`;
    default:
      return username;
  }
}

export default function NotificationBell({
  onOpenChat,
  onOpenCircle,
}: {
  onOpenChat?: (username: string) => void;
  onOpenCircle?: () => void;
}) {
  const { t } = useLanguage();
  const { items, unreadCount, markRead, markAllRead } = useNotifications(true);
  const [open, setOpen] = useState(false);

  function handleRowClick(n: NotificationItem) {
    if (!n.read) markRead(n.id);
    const username = typeof n.payload.username === "string" ? n.payload.username : null;
    if (n.type === "message" && username) {
      onOpenChat?.(username);
      setOpen(false);
    } else if (n.type === "friend_request" || n.type === "friend_accept" || n.type === "session_shared") {
      onOpenCircle?.();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("notif.title")}
        className="relative grid h-10 w-10 place-items-center rounded-pill ring-1 ring-rule [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-sunk"
      >
        <Icon name="Bell" size={16} className="text-ink-700" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-pill bg-claret-600 px-1 font-mono text-[9px] text-paper">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING.layout }}
              exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }}
              className="absolute right-0 z-50 mt-2 w-[320px] rounded-core-sm bg-paper-raised p-2 shadow-ambient ring-1 ring-rule"
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-small font-medium text-ink-900">{t("notif.title")}</p>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="font-mono text-[10px] uppercase tracking-[0.06em] text-sage-700 [@media(hover:hover)_and_(pointer:fine)]:hover:text-sage-600"
                  >
                    {t("notif.markAllRead")}
                  </button>
                ) : null}
              </div>
              <div className="max-h-[360px] divide-y divide-rule overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-2 py-4 text-small text-ink-500">{t("notif.empty")}</p>
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleRowClick(n)}
                      className={[
                        "flex w-full items-start gap-2 px-2 py-2.5 text-left text-small",
                        n.read ? "text-ink-500" : "text-ink-900",
                        "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-sunk",
                      ].join(" ")}
                    >
                      {!n.read ? (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-600" />
                      ) : (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                      )}
                      <span className="flex-1">{notifCopy(n, t)}</span>
                      <span className="shrink-0 font-mono text-[10px] text-ink-300">
                        {timeAgo(n.created_at)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
