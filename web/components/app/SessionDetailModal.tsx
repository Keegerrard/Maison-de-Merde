"use client";

import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import PressButton from "../ui/PressButton";
import SelectField from "../ui/SelectField";
import Icon from "../ui/Icon";
import Rule from "../ui/Rule";
import BristolPicker from "./BristolPicker";
import SymptomChips from "./SymptomChips";
import { apiFetch, ApiError } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/useToast";
import {
  COLORS,
  COLOR_LABELS,
  COLOR_SWATCHES,
  ODORS,
  ODOR_LABELS,
  PAIN_LEVELS,
  PAIN_LABELS,
  SYMPTOMS,
} from "@/lib/enums";
import type { ColorValue, OdorValue, PainValue } from "@/lib/enums";
import { BRISTOL_COLORS } from "@/lib/bristol";
import { formatSessionTime } from "@/lib/format";
import type { SessionDetail, SessionDetailResponse } from "@/lib/types";

const SYMPTOM_LABELS = Object.fromEntries(SYMPTOMS.map((s) => [s.value, s.label]));

export default function SessionDetailModal({
  sessionId,
  onClose,
  onShare,
  onChanged,
}: {
  sessionId: number | null;
  onClose: () => void;
  onShare?: (sessionId: number) => void;
  // Fires after a successful edit or delete so the parent list (LogPanel,
  // CirclePanel, etc.) can refetch — the modal itself only holds its own
  // copy of this one session, not the list it was opened from.
  onChanged?: () => void;
}) {
  const { t, tEnum } = useLanguage();
  const { toast } = useToast();
  const [data, setData] = useState<SessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editBristolType, setEditBristolType] = useState<number | null>(null);
  const [editColor, setEditColor] = useState<ColorValue | "">("");
  const [editOdor, setEditOdor] = useState<OdorValue | "">("");
  const [editPain, setEditPain] = useState<PainValue | "">("");
  const [editSymptoms, setEditSymptoms] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (sessionId == null) {
      setData(null);
      setEditing(false);
      setConfirmingDelete(false);
      setActionError(null);
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

  function startEdit() {
    if (!session) return;
    setEditBristolType(session.bristol_type);
    setEditColor(session.color || "");
    setEditOdor(session.odor || "");
    setEditPain(session.pain || "");
    setEditSymptoms(session.symptoms);
    setEditNotes(session.notes || "");
    setActionError(null);
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!session) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await apiFetch<{ session: SessionDetail }>(`/api/sessions/${session.id}`, {
        method: "PATCH",
        body: {
          bristolType: editBristolType,
          color: editColor || null,
          odor: editOdor || null,
          pain: editPain || null,
          symptoms: editSymptoms,
          notes: editNotes,
        },
      });
      setData((prev) => (prev ? { ...prev, session: res.session } : prev));
      setEditing(false);
      toast(t("common.save"), "success");
      onChanged?.();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t("log.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!session) return;
    setDeleting(true);
    setActionError(null);
    try {
      await apiFetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      onChanged?.();
      onClose();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t("session.deleteError"));
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  const COLOR_OPTIONS = [
    { value: "", label: t("log.notSet") },
    ...COLORS.map((c) => ({ value: c, label: tEnum("color", c, COLOR_LABELS[c]), swatch: COLOR_SWATCHES[c] })),
  ];
  const ODOR_OPTIONS = [
    { value: "", label: t("log.notSet") },
    ...ODORS.map((o) => ({ value: o, label: tEnum("odor", o, ODOR_LABELS[o]) })),
  ];
  const PAIN_OPTIONS = [
    { value: "", label: t("log.notSet") },
    ...PAIN_LEVELS.map((p) => ({ value: p, label: tEnum("pain", p, PAIN_LABELS[p]) })),
  ];

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
        ) : session && editing ? (
          <div className="mt-6 flex flex-col gap-6">
            <p className="font-mono text-small text-ink-500">
              {formatSessionTime(session.occurred_at)}
            </p>

            <div>
              <p className="mb-2 text-small font-medium text-ink-700">{t("session.bristolType")}</p>
              <BristolPicker
                value={editBristolType}
                onChange={setEditBristolType}
                layoutId="bristol-selection-edit"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SelectField
                label={t("session.color")}
                options={COLOR_OPTIONS}
                value={editColor}
                onChange={(e) => setEditColor(e.target.value as ColorValue | "")}
              />
              <SelectField
                label={t("session.odor")}
                options={ODOR_OPTIONS}
                value={editOdor}
                onChange={(e) => setEditOdor(e.target.value as OdorValue | "")}
              />
              <SelectField
                label={t("session.pain")}
                options={PAIN_OPTIONS}
                value={editPain}
                onChange={(e) => setEditPain(e.target.value as PainValue | "")}
              />
            </div>

            <SymptomChips value={editSymptoms} onChange={setEditSymptoms} />

            <div className="flex flex-col gap-1.5">
              <p className="text-small font-medium text-ink-700">{t("session.notes")}</p>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value.slice(0, 2000))}
                rows={4}
                className="w-full rounded-core-sm bg-paper-sunk px-3.5 py-2.5 text-small text-ink-900 ring-1 ring-rule outline-none focus:ring-sage-600"
              />
            </div>

            {actionError ? <p className="text-small text-claret-600">{actionError}</p> : null}

            <div className="flex gap-3">
              <PressButton type="button" onClick={handleSaveEdit} disabled={saving} className="flex-1">
                {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : null}
                {t("common.save")}
              </PressButton>
              <PressButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setActionError(null);
                }}
                className="flex-1"
              >
                {t("common.cancel")}
              </PressButton>
            </div>
          </div>
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
                      {tEnum("color", session.color, COLOR_LABELS[session.color])}
                    </span>
                  }
                />
              ) : null}
              {session.odor ? (
                <DetailField label={t("session.odor")} value={tEnum("odor", session.odor, ODOR_LABELS[session.odor])} />
              ) : null}
              {session.pain ? (
                <DetailField label={t("session.pain")} value={tEnum("pain", session.pain, PAIN_LABELS[session.pain])} />
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
                      {tEnum("symptom", s, SYMPTOM_LABELS[s] || s)}
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

            {data?.isOwner ? (
              <>
                <Rule />
                {actionError ? <p className="text-small text-claret-600">{actionError}</p> : null}
                {confirmingDelete ? (
                  <div className="flex flex-col gap-3 rounded-core-sm bg-claret-100 p-3.5 ring-1 ring-claret-200">
                    <p className="text-small text-claret-600">{t("session.deleteConfirm")}</p>
                    <div className="flex gap-2">
                      <PressButton
                        type="button"
                        variant="danger"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1"
                      >
                        {deleting ? <Icon name="Loader2" size={16} className="animate-spin" /> : null}
                        {t("session.deleteConfirmButton")}
                      </PressButton>
                      <PressButton
                        type="button"
                        variant="secondary"
                        onClick={() => setConfirmingDelete(false)}
                        disabled={deleting}
                        className="flex-1"
                      >
                        {t("common.cancel")}
                      </PressButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {onShare ? (
                      <PressButton type="button" variant="secondary" onClick={() => onShare(session.id)} className="flex-1">
                        <Icon name="Share2" size={15} />
                        {t("common.share")}
                      </PressButton>
                    ) : null}
                    <PressButton type="button" variant="secondary" onClick={startEdit} className="flex-1">
                      <Icon name="Pencil" size={15} />
                      {t("session.edit")}
                    </PressButton>
                    <PressButton
                      type="button"
                      variant="secondary"
                      onClick={() => setConfirmingDelete(true)}
                      className="flex-1 !text-claret-600"
                    >
                      <Icon name="Trash2" size={15} />
                      {t("session.delete")}
                    </PressButton>
                  </div>
                )}
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
