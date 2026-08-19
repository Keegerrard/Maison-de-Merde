"use client";

import Icon from "../ui/Icon";
import TabRail, { type TabId } from "./TabRail";
import StreakPill from "./StreakPill";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";

export default function TopBar({
  active,
  onChangeTab,
  onLogout,
  isPremium,
  onOpenProfile,
  onOpenChat,
  onOpenCircle,
}: {
  active: TabId;
  onChangeTab: (id: TabId) => void;
  onLogout: () => void;
  isPremium: boolean;
  onOpenProfile: () => void;
  onOpenChat: (username: string) => void;
  onOpenCircle: () => void;
}) {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-3 md:px-10">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-title text-ink-900">
            {t("app.name")}
          </span>
          <span className="hidden font-mono text-eyebrow uppercase text-ink-300 md:inline">
            {t("app.established")}
          </span>
          {isPremium ? (
            <span className="hidden rounded-pill bg-ink-900 px-2.5 py-0.5 font-mono text-eyebrow uppercase text-paper md:inline-flex">
              Member
            </span>
          ) : null}
        </div>

        <TabRail active={active} onChange={onChangeTab} />

        <div className="flex items-center gap-2">
          <StreakPill />
          <LanguageSwitcher />
          <NotificationBell onOpenChat={onOpenChat} onOpenCircle={onOpenCircle} />
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={t("profile.title")}
            className="grid h-10 w-10 place-items-center rounded-pill ring-1 ring-rule [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-sunk"
          >
            <Icon name="User" size={16} className="text-ink-700" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="hidden items-center gap-1.5 rounded-pill px-3 py-2 text-small text-ink-500 ring-1 ring-rule [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900 md:inline-flex"
          >
            <Icon name="X" size={14} />
            {t("common.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
