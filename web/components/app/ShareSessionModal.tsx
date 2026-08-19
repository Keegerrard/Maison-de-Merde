"use client";

import { useEffect, useState, type FormEvent } from "react";
import Modal from "../ui/Modal";
import PressButton from "../ui/PressButton";
import Checkbox from "../ui/Checkbox";
import SelectField from "../ui/SelectField";
import Icon from "../ui/Icon";
import { apiFetch, ApiError } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { useCircle } from "@/hooks/useCircle";
import { useToast } from "@/hooks/useToast";
import type { SessionDetailResponse } from "@/lib/types";

export default function ShareSessionModal({
  sessionId,
  onClose,
}: {
  sessionId: number | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { leaderboard } = useCircle();
  const friends = leaderboard.filter((e) => !e.isMe);

  const [caption, setCaption] = useState("");
  const [includePhoto, setIncludePhoto] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId == null) {
      setCaption("");
      setIncludePhoto(false);
      setError(null);
      return;
    }
    apiFetch<SessionDetailResponse>(`/api/sessions/${sessionId}`)
      .then((res) => setHasPhoto(!!res.session.photo_kept))
      .catch(() => setHasPhoto(false));
  }, [sessionId]);

  useEffect(() => {
    if (friends.length && !recipient) setRecipient(friends[0].username);
  }, [friends, recipient]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sessionId == null || !recipient) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/sessions/${sessionId}/share`, {
        method: "POST",
        body: { username: recipient, caption, includePhoto },
      });
      toast(t("share.success"), "success");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to share.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={sessionId != null} onClose={onClose} title={t("share.title")}>
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute right-0 top-0 text-ink-500 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
        >
          <Icon name="X" size={16} />
        </button>

        <h2 className="font-display text-title text-ink-900">{t("share.title")}</h2>

        {friends.length === 0 ? (
          <p className="mt-6 text-small text-ink-500">{t("share.noFriends")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <SelectField
              label={t("share.recipient")}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              options={friends.map((f) => ({ value: f.username, label: f.username }))}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-ink-700">
                {t("share.caption")}
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 500))}
                rows={3}
                className="rounded-sm bg-paper-sunk px-4 py-3 text-body text-ink-900 ring-1 ring-rule placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
            </div>

            {hasPhoto ? (
              <Checkbox
                label={t("share.includePhoto")}
                checked={includePhoto}
                onChange={(e) => setIncludePhoto(e.target.checked)}
              />
            ) : null}

            {error ? (
              <p className="rounded-sm bg-claret-100 px-3 py-2 text-small text-claret-600 ring-1 ring-claret-200">
                {error}
              </p>
            ) : null}

            <PressButton type="submit" fullWidth disabled={submitting}>
              {submitting ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <Icon name="Share2" size={15} />
              )}
              {t("share.button")}
            </PressButton>
          </form>
        )}
      </div>
    </Modal>
  );
}
