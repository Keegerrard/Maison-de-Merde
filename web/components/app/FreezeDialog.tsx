"use client";

import { useEffect, useState } from "react";
import Icon from "../ui/Icon";
import Modal from "../ui/Modal";
import PressButton from "../ui/PressButton";
import TextInput from "../ui/TextInput";
import { apiFetch } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/hooks/useToast";
import { useLanguage } from "@/hooks/useLanguage";
import type { FreezeResponse } from "@/lib/types";

const PRESETS = [3, 7, 14, 30];

export default function FreezeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { refresh } = useDashboard();
  const { toast } = useToast();
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCustom("");
      setError(null);
    }
  }, [open]);

  async function submitFreeze(days: number) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch<FreezeResponse>("/api/dashboard/freeze", {
        method: "POST",
        body: { days },
      });
      await refresh();
      toast(t("freeze.success", { days }), "success");
      onClose();
    } catch {
      setError(t("freeze.error"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCustomSubmit() {
    const n = parseInt(custom, 10);
    if (!n || n < 1 || n > 60) {
      setError(t("freeze.rangeError"));
      return;
    }
    submitFreeze(n);
  }

  return (
    <Modal open={open} onClose={onClose} title={t("freeze.title")}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-eyebrow uppercase text-ink-300">
            {t("freeze.badge")}
          </p>
          <h2 className="mt-1 font-display text-title text-ink-900">
            {t("freeze.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("freeze.close")}
          className="rounded-pill p-1.5 text-ink-500 transition-transform duration-[140ms] ease-out active:scale-[0.9] [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
        >
          <Icon name="X" size={18} />
        </button>
      </div>

      <p className="mb-6 text-body text-ink-500">
        {t("freeze.description")}
      </p>

      <div className="mb-6 grid grid-cols-4 gap-2">
        {PRESETS.map((d) => (
          <PressButton
            key={d}
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={() => submitFreeze(d)}
          >
            {d}d
          </PressButton>
        ))}
      </div>

      <div className="flex items-end gap-3">
        <TextInput
          label={t("freeze.customLabel")}
          type="number"
          min={1}
          max={60}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          error={error ?? undefined}
          disabled={submitting}
          className="flex-1"
        />
        <PressButton
          type="button"
          variant="primary"
          disabled={submitting || !custom}
          onClick={handleCustomSubmit}
        >
          <Icon name="Snowflake" size={16} />
          {t("freeze.confirm")}
        </PressButton>
      </div>
    </Modal>
  );
}
