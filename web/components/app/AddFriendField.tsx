"use client";

import { useState, type FormEvent } from "react";
import TextInput from "../ui/TextInput";
import PressButton from "../ui/PressButton";
import Icon from "../ui/Icon";
import { ApiError, apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export default function AddFriendField({
  onAdded,
}: {
  onAdded: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setError(null);
    setSubmitting(true);
    try {
      await apiFetch<{ ok: true }>("/api/circle/friends", {
        method: "POST",
        body: { username: trimmed },
      });
      setUsername("");
      await onAdded();
      toast("Friend request sent.");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("No account with that name.");
        } else if (err.status === 400) {
          setError("You cannot add yourself.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to send request.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col items-end gap-3 sm:flex-row">
        <div className="w-full flex-1">
          <TextInput
            label="Ajouter par nom d'utilisateur"
            mono
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={error ?? undefined}
            placeholder="nom_utilisateur"
            autoComplete="off"
          />
        </div>
        <PressButton
          type="submit"
          variant="primary"
          disabled={submitting || !username.trim()}
          className="shrink-0"
        >
          {submitting ? (
            <Icon name="Loader2" size={16} className="animate-spin" />
          ) : (
            <Icon name="UserPlus" size={16} />
          )}
          Ajouter
        </PressButton>
      </div>
    </form>
  );
}
