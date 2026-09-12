"use client";

import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icon";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";

const HOVER = "[@media(hover:hover)_and_(pointer:fine)]:hover";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      className={[
        "relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-pill ring-1 ring-rule",
        `${HOVER}:bg-paper-sunk`,
        className,
      ].join(" ")}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="grid place-items-center text-ink-700"
        >
          <Icon name={isDark ? "Moon" : "Sun"} size={16} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
