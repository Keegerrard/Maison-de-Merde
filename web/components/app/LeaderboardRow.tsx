"use client";

import { motion } from "framer-motion";
import Icon from "../ui/Icon";
import { formatPercent, initialOf } from "@/lib/format";
import { SPRING } from "@/lib/motion";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardRow({
  entry,
  rank,
  index,
  onChat,
}: {
  entry: LeaderboardEntry;
  rank: number;
  index: number;
  onChat?: () => void;
}) {
  const isTop = rank <= 3;

  return (
    <motion.div
      layout
      transition={SPRING.layout}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        "flex items-center gap-4 px-4 py-3 md:px-6",
        entry.isMe
          ? "border-l-2 border-sage-600 bg-sage-100/40"
          : "border-l-2 border-transparent",
      ].join(" ")}
    >
      <span
        className={[
          "w-6 shrink-0 font-display text-title tabular-nums",
          isTop ? "text-ink-900" : "text-ink-300",
        ].join(" ")}
      >
        {rank}
      </span>

      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-small ring-1",
          entry.isMe
            ? "bg-sage-100 text-sage-700 ring-sage-600"
            : "bg-paper-sunk text-ink-700 ring-rule",
        ].join(" ")}
      >
        {initialOf(entry.username)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium text-ink-900">
          {entry.username}
          {entry.isMe ? (
            <span className="ml-1 font-mono text-ink-500">(you)</span>
          ) : null}
        </p>
        <p className="mt-0.5 font-mono text-small text-ink-500">
          {entry.streak}d · {formatPercent(entry.consistency)} consistency
        </p>
        <div className="mt-2 h-px w-full bg-rule">
          <motion.div
            className="h-px bg-sage-600"
            style={{ transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: entry.consistency }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
          />
        </div>
      </div>

      {onChat ? (
        <button
          type="button"
          onClick={onChat}
          aria-label={`Chat with ${entry.username}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-pill ring-1 ring-rule [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-sunk"
        >
          <Icon name="MessageCircle" size={15} className="text-ink-500" />
        </button>
      ) : null}
    </motion.div>
  );
}
