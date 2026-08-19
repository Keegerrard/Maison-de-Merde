"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ChatMessage, ChatThreadResponse } from "@/lib/types";

const POLL_MS = 4000;

/**
 * Polls a single 1:1 thread while `username` is non-null (i.e. the chat
 * modal is open). Mirrors the polling approach already used for
 * notifications — no websockets in this app.
 */
export function useChat(username: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const timerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!username) return;
    try {
      const data = await apiFetch<ChatThreadResponse>(
        `/api/chat/${encodeURIComponent(username)}`
      );
      setMessages(data.messages);
      setError(null);
    } catch {
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (!username) {
      setMessages([]);
      return;
    }
    setLoading(true);
    refresh();
    timerRef.current = window.setInterval(refresh, POLL_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [username, refresh]);

  const send = useCallback(
    async (body: string) => {
      if (!username || !body.trim()) return;
      setSending(true);
      try {
        await apiFetch(`/api/chat/${encodeURIComponent(username)}`, {
          method: "POST",
          body: { body },
        });
        await refresh();
      } finally {
        setSending(false);
      }
    },
    [username, refresh]
  );

  return { messages, loading, error, sending, send, refresh };
}
