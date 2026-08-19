"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../ui/Icon";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGES } from "@/lib/i18n/translations";
import { SPRING } from "@/lib/motion";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("lang.label")}
        className="hidden items-center gap-1.5 rounded-pill px-3 py-2 text-small text-ink-700 ring-1 ring-rule [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-sunk sm:inline-flex"
      >
        <Icon name="Globe" size={14} />
        <span className="font-mono text-[11px] uppercase">{current.label}</span>
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("lang.label")}
        className="grid h-10 w-10 place-items-center rounded-pill ring-1 ring-rule sm:hidden"
      >
        <Icon name="Globe" size={16} className="text-ink-700" />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING.layout }}
              exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }}
              className="absolute right-0 z-50 mt-2 w-[180px] rounded-core-sm bg-paper-raised p-1.5 shadow-ambient ring-1 ring-rule"
            >
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-core-sm px-3 py-2 text-small",
                    lang === l.code ? "bg-sage-100 text-sage-700" : "text-ink-700 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-sunk",
                  ].join(" ")}
                >
                  {l.label}
                  {lang === l.code ? <Icon name="Check" size={13} /> : null}
                </button>
              ))}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
