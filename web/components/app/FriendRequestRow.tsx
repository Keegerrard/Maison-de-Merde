"use client";

import { motion } from "framer-motion";
import PressButton from "../ui/PressButton";
import Icon from "../ui/Icon";
import type { FriendRequest } from "@/lib/types";

export default function FriendRequestRow({
  request,
  accepting,
  onAccept,
}: {
  request: FriendRequest;
  accepting: boolean;
  onAccept: (request: FriendRequest) => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 overflow-hidden py-3"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-sunk ring-1 ring-rule">
        <Icon name="Users" size={16} className="text-ink-500" />
      </span>
      <p className="flex-1 text-small text-ink-700">
        <span className="font-medium text-ink-900">{request.username}</span>{" "}
        wants to join your circle
      </p>
      <PressButton
        type="button"
        variant="secondary"
        disabled={accepting}
        onClick={() => onAccept(request)}
      >
        {accepting ? (
          <Icon name="Loader2" size={14} className="animate-spin" />
        ) : null}
        Accept
      </PressButton>
    </motion.li>
  );
}
