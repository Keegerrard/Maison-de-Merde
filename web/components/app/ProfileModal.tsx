"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "../ui/Modal";
import PressButton from "../ui/PressButton";
import TextInput from "../ui/TextInput";
import Checkbox from "../ui/Checkbox";
import Icon from "../ui/Icon";
import Rule from "../ui/Rule";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/useToast";
import { BANNERS } from "@/lib/enums";
import { drawProfileCard } from "@/lib/profileCard";
import { apiFetch, ApiError } from "@/lib/api";
import type { ChangeUsernameResponse } from "@/lib/types";

export default function ProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t, tBadge } = useLanguage();
  const { toast } = useToast();
  const { profile, loading, update, refresh } = useProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [nickname, setNickname] = useState("");
  const [banner, setBanner] = useState<(typeof BANNERS)[number]["id"]>("sage");
  const [traitBadgeId, setTraitBadgeId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setNickname(profile.nickname || "");
    setBanner(profile.banner);
    setTraitBadgeId(profile.traitBadgeId);
    setIsPublic(profile.isPublic);
    setDirty(false);
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    try {
      await update({
        nickname,
        banner,
        traitBadgeId: traitBadgeId || null,
        isPublic,
      });
      toast(t("common.save"), "success");
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeUsername() {
    setUsernameError(null);
    setUsernameSaving(true);
    try {
      const res = await apiFetch<ChangeUsernameResponse>("/api/auth/username", {
        method: "PATCH",
        body: { newUsername, password: usernamePassword },
      });
      toast(t("account.usernameUpdated"), "success");
      setUsernamePassword("");
      setNewUsername("");
      setShowUsernameForm(false);
      await refresh();
      void res;
    } catch (e) {
      setUsernameError(e instanceof ApiError ? e.message : t("account.genericError"));
    } finally {
      setUsernameSaving(false);
    }
  }

  function cardData() {
    if (!profile) return null;
    const trait = traitBadgeId
      ? profile.unlockedBadges.find((b) => b.id === traitBadgeId)
      : null;
    return {
      username: profile.username,
      nickname: nickname || null,
      banner,
      traitName: trait ? tBadge(trait.id, "name", trait.name) : null,
      traitIcon: trait?.icon ?? null,
      stats: profile.stats,
      badgeIcons: profile.unlockedBadges.map((b) => b.icon),
      joinedAt: profile.joinedAt,
    };
  }

  function handleExport() {
    const canvas = canvasRef.current;
    const data = cardData();
    if (!canvas || !data) return;
    const url = drawProfileCard(canvas, data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.username}-maison-de-merde-card.png`;
    a.click();
  }

  function handlePrint() {
    window.setTimeout(() => window.print(), 50);
  }

  const bannerTheme = BANNERS.find((b) => b.id === banner) ?? BANNERS[0];
  const data = cardData();

  return (
    <>
      <Modal open={open} onClose={onClose} title={t("profile.title")} maxWidth="560px">
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="absolute right-0 top-0 text-ink-500 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
          >
            <Icon name="X" size={16} />
          </button>

          <h2 className="font-display text-title text-ink-900">{t("profile.title")}</h2>

          {loading || !profile ? (
            <p className="mt-6 text-small text-ink-500">{t("common.loading")}</p>
          ) : (
            <div className="mt-6 flex flex-col gap-6">
              {/* Live card preview */}
              <div
                className="flex flex-col justify-between overflow-hidden rounded-core-sm p-6 text-white shadow-ambient"
                style={{
                  background: `linear-gradient(135deg, ${bannerTheme.from}, ${bannerTheme.to})`,
                  minHeight: 190,
                }}
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                    Maison de Merde
                  </p>
                  <p className="mt-2 font-display text-2xl">
                    {nickname || profile.username}
                  </p>
                  <p className="text-small text-white/70">@{profile.username}</p>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex gap-5">
                    <MiniStat label={t("profile.stats.sessions")} value={profile.stats.totalSessions} />
                    <MiniStat label={t("profile.stats.streak")} value={profile.stats.currentStreak} />
                    <MiniStat label={t("profile.stats.badges")} value={`${profile.stats.badgesUnlocked}/${profile.stats.badgesTotal}`} />
                  </div>
                  {traitBadgeId ? (
                    <span className="text-small text-white/90">
                      {profile.unlockedBadges.find((b) => b.id === traitBadgeId)?.icon}{" "}
                      {(() => {
                        const trait = profile.unlockedBadges.find((b) => b.id === traitBadgeId);
                        return trait ? tBadge(trait.id, "name", trait.name) : null;
                      })()}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-3">
                <PressButton type="button" variant="secondary" onClick={handleExport} className="flex-1">
                  <Icon name="Download" size={15} />
                  {t("profile.exportCard")}
                </PressButton>
                <PressButton type="button" variant="secondary" onClick={handlePrint} className="flex-1">
                  <Icon name="Printer" size={15} />
                  {t("profile.printCard")}
                </PressButton>
              </div>

              <Rule />

              <TextInput
                label={t("profile.nickname")}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value.slice(0, 40));
                  setDirty(true);
                }}
                placeholder={profile.username}
              />

              <div className="flex flex-col gap-1.5">
                <p className="text-small font-medium text-ink-700">{t("profile.banner")}</p>
                <div className="flex flex-wrap gap-2">
                  {BANNERS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBanner(b.id);
                        setDirty(true);
                      }}
                      aria-label={b.label}
                      className={[
                        "h-9 w-9 rounded-full ring-2 transition-transform duration-150",
                        banner === b.id ? "ring-ink-900 scale-110" : "ring-transparent",
                      ].join(" ")}
                      style={{ background: `linear-gradient(135deg, ${b.from}, ${b.to})` }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-small font-medium text-ink-700">{t("profile.trait")}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTraitBadgeId(null);
                      setDirty(true);
                    }}
                    className={[
                      "rounded-pill px-3.5 py-2 text-small ring-1",
                      traitBadgeId === null
                        ? "bg-sage-100 text-sage-700 ring-sage-600"
                        : "bg-paper-sunk text-ink-700 ring-rule",
                    ].join(" ")}
                  >
                    {t("profile.traitNone")}
                  </button>
                  {profile.unlockedBadges.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setTraitBadgeId(b.id);
                        setDirty(true);
                      }}
                      className={[
                        "rounded-pill px-3.5 py-2 text-small ring-1",
                        traitBadgeId === b.id
                          ? "bg-sage-100 text-sage-700 ring-sage-600"
                          : "bg-paper-sunk text-ink-700 ring-rule",
                      ].join(" ")}
                    >
                      {b.icon} {tBadge(b.id, "name", b.name)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-small font-medium text-ink-700">{t("profile.visibility")}</p>
                <Checkbox
                  label={isPublic ? t("profile.public") : t("profile.private")}
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                    setDirty(true);
                  }}
                />
              </div>

              <PressButton type="button" onClick={handleSave} disabled={!dirty || saving} fullWidth>
                {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : null}
                {t("common.save")}
              </PressButton>

              <Rule />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-small font-medium text-ink-700">{t("account.username")}</p>
                  {!showUsernameForm ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUsernameForm(true);
                        setNewUsername(profile.username);
                        setUsernameError(null);
                      }}
                      className="text-small text-ink-500 underline-offset-2 [@media(hover:hover)_and_(pointer:fine)]:hover:underline"
                    >
                      {t("account.changeUsername")}
                    </button>
                  ) : null}
                </div>

                {!showUsernameForm ? (
                  <p className="text-small text-ink-500">@{profile.username}</p>
                ) : (
                  <div className="flex flex-col gap-3 rounded-core-sm bg-paper-sunk p-3.5">
                    <TextInput
                      label={t("account.newUsername")}
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.slice(0, 24))}
                    />
                    <TextInput
                      label={t("account.currentPassword")}
                      type="password"
                      value={usernamePassword}
                      onChange={(e) => setUsernamePassword(e.target.value)}
                    />
                    {usernameError ? <p className="text-small text-claret-600">{usernameError}</p> : null}
                    <div className="flex gap-2">
                      <PressButton
                        type="button"
                        onClick={handleChangeUsername}
                        disabled={usernameSaving || !newUsername || !usernamePassword}
                        className="flex-1"
                      >
                        {usernameSaving ? <Icon name="Loader2" size={16} className="animate-spin" /> : null}
                        {t("common.save")}
                      </PressButton>
                      <PressButton
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowUsernameForm(false);
                          setUsernameError(null);
                          setUsernamePassword("");
                        }}
                        className="flex-1"
                      >
                        {t("common.cancel")}
                      </PressButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </div>
      </Modal>

      {typeof document !== "undefined" && data
        ? createPortal(
            <PrintableCard bannerFrom={bannerTheme.from} bannerTo={bannerTheme.to} data={data} t={t} />,
            document.getElementById("print-card-root") ?? document.body
          )
        : null}
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-mono text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-white/60">{label}</p>
    </div>
  );
}

function PrintableCard({
  bannerFrom,
  bannerTo,
  data,
  t,
}: {
  bannerFrom: string;
  bannerTo: string;
  data: {
    username: string;
    nickname: string | null;
    traitName: string | null;
    traitIcon: string | null;
    stats: { totalSessions: number; currentStreak: number; longestStreak: number; badgesUnlocked: number; badgesTotal: number };
    badgeIcons: string[];
  };
  t: (key: string) => string;
}) {
  return (
    <div
      style={{
        width: "9in",
        maxWidth: "100%",
        margin: "1in auto",
        padding: "48px",
        borderRadius: 24,
        color: "#fff",
        background: `linear-gradient(135deg, ${bannerFrom}, ${bannerTo})`,
      }}
    >
      <p style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 3, opacity: 0.7 }}>
        MAISON DE MERDE
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 48, margin: "16px 0 4px" }}>
        {data.nickname || data.username}
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>@{data.username}</p>
      {data.traitName ? (
        <p style={{ fontSize: 20, marginBottom: 24 }}>
          {data.traitIcon} {data.traitName}
        </p>
      ) : null}
      <div style={{ display: "flex", gap: 40 }}>
        <div>
          <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{data.stats.totalSessions}</p>
          <p style={{ fontSize: 11, opacity: 0.6 }}>{t("profile.stats.sessions")}</p>
        </div>
        <div>
          <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{data.stats.currentStreak}</p>
          <p style={{ fontSize: 11, opacity: 0.6 }}>{t("profile.stats.streak")}</p>
        </div>
        <div>
          <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
            {data.stats.badgesUnlocked}/{data.stats.badgesTotal}
          </p>
          <p style={{ fontSize: 11, opacity: 0.6 }}>{t("profile.stats.badges")}</p>
        </div>
      </div>
      {data.badgeIcons.length ? (
        <p style={{ fontSize: 28, marginTop: 24 }}>{data.badgeIcons.join("  ")}</p>
      ) : null}
    </div>
  );
}
