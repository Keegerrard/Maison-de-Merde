"use client";

import Icon from "../ui/Icon";
import TabRail, { type TabId } from "./TabRail";
import StreakPill from "./StreakPill";

export default function TopBar({
  active,
  onChangeTab,
  onLogout,
  isPremium,
}: {
  active: TabId;
  onChangeTab: (id: TabId) => void;
  onLogout: () => void;
  isPremium: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-3 md:px-10">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-title text-ink-900">
            Maison de Merde
          </span>
          <span className="hidden font-mono text-eyebrow uppercase text-ink-300 md:inline">
            Établie 2026
          </span>
          {isPremium ? (
            <span className="hidden rounded-pill bg-ink-900 px-2.5 py-0.5 font-mono text-eyebrow uppercase text-paper md:inline-flex">
              Membre
            </span>
          ) : null}
        </div>

        <TabRail active={active} onChange={onChangeTab} />

        <div className="flex items-center gap-3">
          <StreakPill />
          <button
            type="button"
            onClick={onLogout}
            className="hidden items-center gap-1.5 rounded-pill px-3 py-2 text-small text-ink-500 ring-1 ring-rule [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900 md:inline-flex"
          >
            <Icon name="X" size={14} />
            Se déconnecter
          </button>
        </div>
      </div>
    </header>
  );
}
