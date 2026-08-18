"use client";

import SkeletonRow from "../ui/SkeletonRow";
import { COLOR_LABELS } from "@/lib/enums";
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
  return (
    <div className="rounded-core-sm bg-paper-sunk p-4 ring-1 ring-rule">
      {status === "loading" ? <SkeletonRow /> : null}

      {status === "error" ? (
        <p className="text-small text-claret-600">{errorMessage}</p>
      ) : null}

      {status === "withheld" ? (
        <p className="text-small text-ink-500">
          The model was not confident enough to call this one. Please set the
          fields yourself.
        </p>
      ) : null}

      {status === "result" && result ? (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-small text-ink-700">
            Confidence:{" "}
            <span className="text-ink-900">
              {Math.round(result.confidence * 100)}%
            </span>
          </p>
          <p className="text-small text-ink-700">
            Suggests{" "}
            {result.bristolTypeGuess
              ? `Bristol Type ${result.bristolTypeGuess}`
              : "no clear Bristol type"}
            {result.colorGuess
              ? `, colour ${COLOR_LABELS[result.colorGuess].toLowerCase()}`
              : ""}
            {result.visibleFoodGuess ? ", visible undigested food" : ""}.
          </p>
          {result.notes ? (
            <p className="text-small text-ink-500">{result.notes}</p>
          ) : null}
          <p className="text-small text-ink-500">
            This is a pattern-recognition aid, not a diagnosis. Please
            confirm or correct the fields above.
          </p>
        </div>
      ) : null}
    </div>
  );
}
