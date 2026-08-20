"use client";

import SkeletonRow from "../ui/SkeletonRow";
import { COLOR_LABELS } from "@/lib/enums";
import { useLanguage } from "@/hooks/useLanguage";
import type { VisionResultResponse } from "@/lib/types";

export type AiSuggestionStatus = "loading" | "withheld" | "result" | "error";

export default function AiSuggestionNote({
  status,
  result,
  errorMessage,
}: {
  status: AiSuggestionStatus;
  result?: VisionResultResponse | null;
  errorMessage?: string | null;
}) {
  const { t, tEnum } = useLanguage();
  return (
    <div className="rounded-core-sm bg-paper-sunk p-4 ring-1 ring-rule">
      {status === "loading" ? <SkeletonRow /> : null}

      {status === "error" ? (
        <p className="text-small text-claret-600">{errorMessage}</p>
      ) : null}

      {status === "withheld" ? (
        <p className="text-small text-ink-500">{t("ai.withheld")}</p>
      ) : null}

      {status === "result" && result ? (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-small text-ink-700">
            {t("ai.confidence")}{" "}
            <span className="text-ink-900">
              {Math.round(result.confidence * 100)}%
            </span>
          </p>
          <p className="text-small text-ink-700">
            {t("ai.suggestsPrefix")}{" "}
            {result.bristolTypeGuess
              ? `${t("log.bristolType")} ${result.bristolTypeGuess}`
              : t("ai.noClearType")}
            {result.colorGuess
              ? `, ${tEnum("color", result.colorGuess, COLOR_LABELS[result.colorGuess]).toLowerCase()}`
              : ""}
            {result.visibleFoodGuess ? t("ai.visibleFoodGuess") : ""}.
          </p>
          {result.notes ? (
            <p className="text-small text-ink-500">{result.notes}</p>
          ) : null}
          <p className="text-small text-ink-500">{t("ai.notDiagnosis")}</p>
        </div>
      ) : null}
    </div>
  );
}
