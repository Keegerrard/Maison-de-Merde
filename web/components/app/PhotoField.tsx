"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../ui/Icon";
import Checkbox from "../ui/Checkbox";
import AiSuggestionNote from "./AiSuggestionNote";
import { apiFetch, ApiError } from "@/lib/api";
import { EASE, SPRING } from "@/lib/motion";
import type { ColorValue } from "@/lib/enums";
import type { VisionResponse } from "@/lib/types";

export interface PhotoSuggestion {
  color?: ColorValue;
  bristolType?: number;
  visibleFood?: boolean;
  aiConfidence: number;
}

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "withheld" }
  | { status: "result"; response: Extract<VisionResponse, { withheld: false }> };

export default function PhotoField({
  onSuggestion,
  onPhotoChange,
}: {
  onSuggestion?: (suggestion: PhotoSuggestion) => void;
  onPhotoChange?: (state: {
    photoDataUrl: string | null;
    keepPhoto: boolean;
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [keepPhoto, setKeepPhoto] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });

  function handlePick() {
    inputRef.current?.click();
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      onPhotoChange?.({ photoDataUrl: dataUrl, keepPhoto });
    };
    reader.readAsDataURL(file);

    void analyze(file);
  }

  async function analyze(file: File) {
    setAnalysis({ status: "loading" });
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await apiFetch<VisionResponse>("/api/vision/analyze", {
        method: "POST",
        body: fd,
      });
      if (res.withheld) {
        setAnalysis({ status: "withheld" });
      } else {
        setAnalysis({ status: "result", response: res });
        onSuggestion?.({
          color: res.colorGuess ?? undefined,
          bristolType: res.bristolTypeGuess ?? undefined,
          visibleFood: res.visibleFoodGuess ?? undefined,
          aiConfidence: res.confidence,
        });
      }
    } catch (err) {
      // A 503 here means photo analysis isn't configured server-side — the
      // server's own message already says so; surface it verbatim rather
      // than replacing it with a generic failure string.
      const message =
        err instanceof ApiError ? err.message : "Photo analysis failed.";
      setAnalysis({ status: "error", message });
    }
  }

  function handleKeepPhotoChange(checked: boolean) {
    setKeepPhoto(checked);
    onPhotoChange?.({ photoDataUrl: preview, keepPhoto: checked });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={handlePick}
        className="flex items-center gap-4 rounded-core-sm bg-paper-sunk p-4 text-left ring-1 ring-rule transition-transform duration-[140ms] ease-out active:scale-[0.99] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-deep"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-paper-raised ring-1 ring-rule">
          <Icon name="Camera" size={18} className="text-ink-700" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-small font-medium text-ink-900">
            Photographie (optionnelle)
          </span>
          <span className="text-small text-ink-500">
            Sent once for analysis. Not stored unless you tick keep.
          </span>
        </span>
      </button>

      {preview ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.26, ease: EASE.out }}
          className="overflow-hidden rounded-core-sm ring-1 ring-rule"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Selected photo preview"
            className="max-h-48 w-full object-cover"
          />
        </motion.div>
      ) : null}

      <AnimatePresence>
        {analysis.status !== "idle" ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: SPRING.layout }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <AiSuggestionNote
              status={analysis.status}
              result={analysis.status === "result" ? analysis.response : null}
              errorMessage={
                analysis.status === "error" ? analysis.message : null
              }
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {preview ? (
        <Checkbox
          label="Keep this photo (off by default)"
          checked={keepPhoto}
          onChange={(e) => handleKeepPhotoChange(e.target.checked)}
        />
      ) : null}
    </div>
  );
}
