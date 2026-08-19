"use client";

import { AnimatePresence, motion } from "framer-motion";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import SkeletonRow from "../ui/SkeletonRow";
import EmptyState from "../ui/EmptyState";
import SessionRow from "./SessionRow";
import StampMark from "./StampMark";
import { useLanguage } from "@/hooks/useLanguage";
import type { SessionRow as SessionRowType } from "@/lib/types";

export interface LogStamp {
  key: number;
  onDone: () => void;
}

export default function SessionList({
  sessions,
  loading,
  stamp,
  onSelect,
}: {
  sessions: SessionRowType[];
  loading: boolean;
  stamp?: LogStamp | null;
  onSelect?: (id: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <DoubleBezelCard padding="none">
      <div className="divide-y divide-rule">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            message={t("session.emptyList")}
            className="px-6"
          />
        ) : (
          sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 5) * 0.06 }}
              className="relative"
            >
              <SessionRow session={session} onClick={onSelect ? () => onSelect(session.id) : undefined} />
              {i === 0 && stamp ? (
                <AnimatePresence>
                  <StampMark key={stamp.key} onDone={stamp.onDone} />
                </AnimatePresence>
              ) : null}
            </motion.div>
          ))
        )}
      </div>
    </DoubleBezelCard>
  );
}
