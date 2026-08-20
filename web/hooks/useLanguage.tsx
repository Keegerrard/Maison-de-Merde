"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LANGUAGES,
  translate,
  translateEnumLabel,
  translateBadgeText,
  type LangCode,
} from "@/lib/i18n/translations";

const STORAGE_KEY = "mdm_lang";

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  tEnum: (
    category: "color" | "odor" | "pain" | "symptom",
    value: string,
    fallback: string
  ) => string;
  tBadge: (badgeId: string, field: "name" | "desc", fallback: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("default");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      setLangState(stored);
    }
  }, []);

  const dir = useMemo<"ltr" | "rtl">(
    () => LANGUAGES.find((l) => l.code === lang)?.dir ?? "ltr",
    [lang]
  );

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang === "default" ? "en" : lang;
  }, [dir, lang]);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, replacements?: Record<string, string | number>) =>
      translate(lang, key, replacements),
    [lang]
  );

  const tEnum = useCallback(
    (category: "color" | "odor" | "pain" | "symptom", value: string, fallback: string) =>
      translateEnumLabel(lang, category, value, fallback),
    [lang]
  );

  const tBadge = useCallback(
    (badgeId: string, field: "name" | "desc", fallback: string) =>
      translateBadgeText(lang, badgeId, field, fallback),
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, tEnum, tBadge, dir }),
    [lang, setLang, t, tEnum, tBadge, dir]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider.");
  }
  return ctx;
}
