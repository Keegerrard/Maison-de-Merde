"use client";

import { motion } from "framer-motion";
import Icon, { type IconName } from "../ui/Icon";
import { SPRING } from "@/lib/motion";

export type TabId = "log" | "dashboard" | "circle" | "achievements";

const TABS: { id: TabId; label: string; subtitle: string; icon: IconName }[] = [
  { id: "log", label: "Journal", subtitle: "Log", icon: "FileText" },
  { id: "dashboard", label: "Analyse", subtitle: "Dashboard", icon: "TrendingUp" },
  { id: "circle", label: "Cercle", subtitle: "Circle", icon: "Users" },
  { id: "achievements", label: "Distinctions", subtitle: "Achievements", icon: "Award" },
];

export default function TabRail({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <>
      {/* Desktop: horizontal tab strip with a sliding hairline indicator. */}
      <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              title={tab.subtitle}
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "relative px-4 py-2 text-small font-medium transition-colors duration-200",
                isActive ? "text-ink-900" : "text-ink-500",
                "[@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900",
              ].join(" ")}
            >
              {tab.label}
              {isActive ? (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-x-3 -bottom-1 h-px bg-sage-600"
                  transition={SPRING.layout}
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Mobile: bottom bar, four equal cells. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Sections"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <Icon
                name={tab.icon}
                size={16}
                className={isActive ? "text-sage-700" : "text-ink-300"}
              />
              <span
                className={[
                  "font-mono text-[10px] uppercase tracking-[0.08em]",
                  isActive ? "text-ink-900" : "text-ink-300",
                ].join(" ")}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
