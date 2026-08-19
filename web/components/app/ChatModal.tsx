"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Modal from "../ui/Modal";
import Icon from "../ui/Icon";
import { useChat } from "@/hooks/useChat";
import { useLanguage } from "@/hooks/useLanguage";
import { formatSessionTime } from "@/lib/format";

export default function ChatModal({
  username,
  onClose,
}: {
  username: string | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { messages, loading, sending, send } = useChat(username);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await send(body);
  }

  return (
    <Modal
      open={username != null}
      onClose={onClose}
      title={`${t("chat.title")} — ${username ?? ""}`}
      maxWidth="440px"
    >
      <div className="relative flex h-[60vh] max-h-[520px] flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-title text-ink-900">{username}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="text-ink-500 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-core-sm bg-paper-sunk p-3"
        >
          {loading && messages.length === 0 ? (
            <p className="text-small text-ink-500">{t("common.loading")}</p>
          ) : messages.length === 0 ? (
            <p className="text-small text-ink-500">{t("chat.empty")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={[
                    "max-w-[80%] rounded-core-sm px-3 py-2 text-small",
                    m.isMine
                      ? "self-end bg-sage-700 text-paper"
                      : "self-start bg-paper-raised text-ink-900 ring-1 ring-rule",
                  ].join(" ")}
                >
                  <p>{m.body}</p>
                  <p
                    className={[
                      "mt-1 font-mono text-[10px] uppercase tracking-[0.08em]",
                      m.isMine ? "text-paper/70" : "text-ink-300",
                    ].join(" ")}
                  >
                    {formatSessionTime(m.created_at)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
            placeholder={t("chat.placeholder")}
            className="flex-1 rounded-pill bg-paper-sunk px-4 py-2.5 text-small text-ink-900 ring-1 ring-rule placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label={t("common.send")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-sage-700 text-paper transition-transform duration-[140ms] active:scale-[0.94] disabled:opacity-40"
          >
            <Icon name="Send" size={15} />
          </button>
        </form>
      </div>
    </Modal>
  );
}
