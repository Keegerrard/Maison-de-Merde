"use client";

import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import PressButton from "../ui/PressButton";
import Icon from "../ui/Icon";
import Rule from "../ui/Rule";
import { apiFetch, ApiError } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import {
  COLOR_LABELS,
  COLOR_SWATCHES,
  ODOR_LABELS,
  PAIN_LABELS,
  SYMPTOMS,
} from "@/lib/enums";
import { BRISTOL_COLORS } from "@/lib/bristol";
import { formatSessionTime } from "@/lib/format";
import type { SessionDetailResponse } from "@/lib/types";

const SYMPTOM_LABELS = Object.fromEntries(SYMPTOMS.map((s) => [s.value, s.label]));

export default function SessionDetailModal({
  sessionId,
  onClose,
  onShare,
}: {
  sessionId: number | null;
  onClose: () => void;
  onShare?: (sessionId: number) => void;
}) {
  const { t } = useLanguage();
  const [data, setData] = useState<SessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId == null) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch<SessionDetailResponse>(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load session.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const session = data?.session;

  return (
    <Modal
      open={sessionId != null}
      onClose={onClose}
      title={t("session.detailTitle")}
      maxWidth="520px"
    >
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute right-0 top-0 text-ink-500 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
        >
          <Icon name="X" size={16} />
        </button>

        <h2 className="font-display text-title text-ink-900">
          {t("session.detailTitle")}
        </h2>

        {loading ? (
          <p className="mt-6 text-small text-ink-500">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-6 text-small text-claret-600">{error}</p>
        ) : session ? (
          <div className="mt-6 flex flex-col gap-5">
            <p className="font-mono text-small text-ink-500">
              {formatSessionTime(session.occurred_at)}
            </p>

            {data?.sharedByUsername ? (
              <p className="text-small text-ink-500">
                {t("session.sharedBy")}{" "}
                <span className="font-medium text-ink-900">{data.sharedByUsername}</span>
              </p>
            ) : null}

            {data?.caption ? (
              <p className="rounded-core-sm bg-paper-sunk px-4 py-3 text-small italic text-ink-700 ring-1 ring-rule">
                “{data.caption}”
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label={t("session.bristolType")}
                value={
                  session.bristol_type ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: BRISTOL_COLORS[session.bristol_type - 1] }}
                      />
                      Type {session.bristol_type}
                    </span>
                  ) : (
                    t("session.quickLog")
                  )
                }
              />
              {session.color ? (
                <DetailField
                  label={t("session.color")}
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-rule-strong"
                        style={{ backgroundColor: COLOR_SWATCHES[session.color] }}
                      />
                      {COLOR_LABELS[session.color]}
                    </span>
                  }
                />
              ) : null}
              {session.odor ? (
                <DetailField label={t("session.odor")} value={ODOR_LABELS[session.odor]} />
              ) : null}
              {session.pain ? (
                <DetailField label={t("session.pain")} value={PAIN_LABELS[session.pain]} />
              ) : null}
              {session.visibleFood ? (
                <DetailField label={t("session.visibleFood")} value={t("common.yes")} />
              ) : null}
            </div>

            {session.bloodFlag ? (
              <div className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-claret-100 px-3 py-1.5 text-small text-claret-600 ring-1 ring-claret-200">
                <Icon name="Droplet" size={13} />
                {t("session.bloodFlagged")}
              </div>
            ) : null}

            {session.symptoms.length ? (
              <div className="flex flex-col gap-2">
                <p className="text-small font-medium text-ink-700">{t("session.symptoms")}</p>
                <div className="flex flex-wrap gap-2">
                  {session.symptoms.map((s) => (
                    <span
                      key={s}
                      className="rounded-pill bg-paper-sunk px-3 py-1 text-small text-ink-700 ring-1 ring-rule"
                    >
                      {SYMPTOM_LABELS[s] || s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {session.notes ? (
              <div className="flex flex-col gap-2">
                <p className="text-small font-medium text-ink-700">{t("session.notes")}</p>
                <p className="text-small text-ink-700">{session.notes}</p>
              </div>
            ) : null}

            {session.photo_kept ? (
              <div className="flex flex-col gap-2">
                <p className="text-small font-medium text-ink-700">{t("session.photo")}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={session.photo_kept}
                  alt="Session photo"
                  className="max-h-72 w-full rounded-core-sm object-cover ring-1 ring-rule"
                />
              </div>
            ) : null}

            {data?.isOwner && onShare ? (
              <>
                <Rule />
                <PressButton
                  type="button"
                  variant="secondary"
                  onClick={() => onShare(session.id)}
                >
                  <Icon name="Share2" size={15} />
                  {t("common.share")}
                </PressButton>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-eyebrow uppercase text-ink-300">{label}</p>
      <p className="text-small text-ink-900">{value}</p>
    </div>
  );
}
