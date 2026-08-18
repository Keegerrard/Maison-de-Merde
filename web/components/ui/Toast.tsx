"use client";

import { motion, type PanInfo } from "framer-motion";
import Icon from "./Icon";
import type { ToastItem } from "@/hooks/useToast";
import { SWIPE_VELOCITY_THRESHOLD } from "@/lib/motion";

const toneIcon = {
  default: "Circle",
  success: "Check",
  error: "AlertTriangle",
} as const;

export default function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  function handleDragEnd(_: unknown, info: PanInfo) {
    const velocity = Math.abs(info.velocity.x) / 1000;
    const distance = Math.abs(info.offset.x);
    if (velocity > SWIPE_VELOCITY_THRESHOLD || distance > 120) {
      onDismiss(item.id);
    }
  }

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.32 } }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
      className={[
        "pointer-events-auto flex w-[320px] max-w-[calc(100vw-2rem)] cursor-grab items-center gap-3",
        "rounded-shell bg-paper-raised px-4 py-3 ring-1 ring-rule shadow-ambient active:cursor-grabbing",
      ].join(" ")}
    >
      <Icon
        name={toneIcon[item.tone]}
        size={16}
        className={
          item.tone === "error"
            ? "text-claret-600 shrink-0"
            : item.tone === "success"
              ? "text-sage-600 shrink-0"
              : "text-ink-500 shrink-0"
        }
      />
      <p className="text-small text-ink-700">{item.message}</p>
    </motion.div>
  );
}
