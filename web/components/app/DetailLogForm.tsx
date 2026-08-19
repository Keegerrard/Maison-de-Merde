"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PressButton from "../ui/PressButton";
import SelectField from "../ui/SelectField";
import Checkbox from "../ui/Checkbox";
import BristolPicker from "./BristolPicker";
import SymptomChips from "./SymptomChips";
import PhotoField, { type PhotoSuggestion } from "./PhotoField";
import { apiFetch, ApiError } from "@/lib/api";
import {
  COLORS,
  COLOR_LABELS,
  COLOR_SWATCHES,
  ODORS,
  ODOR_LABELS,
  PAIN_LEVELS,
  PAIN_LABELS,
} from "@/lib/enums";
import type { ColorValue, OdorValue, PainValue } from "@/lib/enums";
import type { SessionCreateBody, SessionCreateResponse } from "@/lib/types";

const COLOR_OPTIONS = [
  { value: "", label: "Not set" },
  ...COLORS.map((c) => ({
    value: c,
    label: COLOR_LABELS[c],
    swatch: COLOR_SWATCHES[c],
  })),
];

const ODOR_OPTIONS = [
  { value: "", label: "Not set" },
  ...ODORS.map((o) => ({ value: o, label: ODOR_LABELS[o] })),
];

const PAIN_OPTIONS = [
  { value: "", label: "Not set" },
  ...PAIN_LEVELS.map((p) => ({ value: p, label: PAIN_LABELS[p] })),
];

export default function DetailLogForm({
  onSuccess,
}: {
  onSuccess: (response: SessionCreateResponse) => void;
}) {
  const [bristolType, setBristolType] = useState<number | null>(null);
  const [color, setColor] = useState<ColorValue | "">("");
  const [odor, setOdor] = useState<OdorValue | "">("");
  const [pain, setPain] = useState<PainValue | "">("");
  const [visibleFood, setVisibleFood] = useState(false);
  const [bloodFlag, setBloodFlag] = useState(false);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [keepPhoto, setKeepPhoto] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSuggestion(suggestion: PhotoSuggestion) {
    if (suggestion.color) setColor(suggestion.color);
    if (typeof suggestion.bristolType === "number") {
      setBristolType(suggestion.bristolType);
    }
    if (suggestion.visibleFood) setVisibleFood(true);
    setAiSuggested(true);
    setAiConfidence(suggestion.aiConfidence);
  }

  function resetForm() {
    setBristolType(null);
    setColor("");
    setOdor("");
    setPain("");
    setVisibleFood(false);
    setBloodFlag(false);
    setSymptoms([]);
    setAiSuggested(false);
    setAiConfidence(null);
    setKeepPhoto(false);
    setPhotoDataUrl(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const includePhoto = keepPhoto && !!photoDataUrl;
    const body: SessionCreateBody = {
      bristolType,
      color: color || undefined,
      odor: odor || undefined,
      pain: pain || undefined,
      visibleFood,
      bloodFlag,
      symptoms,
      aiSuggested,
      aiConfidence,
      keepPhoto: includePhoto,
      photoDataUrl: includePhoto ? photoDataUrl : undefined,
    };

    try {
      const response = await apiFetch<SessionCreateResponse>(
        "/api/sessions",
        { method: "POST", body }
      );
      resetForm();
      onSuccess(response);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save this session."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-small font-medium text-ink-700">
          Type Bristol
        </p>
        <BristolPicker value={bristolType} onChange={setBristolType} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          label="Couleur"
          options={COLOR_OPTIONS}
          value={color}
          onChange={(e) => setColor(e.target.value as ColorValue | "")}
        />
        <SelectField
          label="Odeur"
          options={ODOR_OPTIONS}
          value={odor}
          onChange={(e) => setOdor(e.target.value as OdorValue | "")}
        />
        <SelectField
          label="Douleur ou effort"
          options={PAIN_OPTIONS}
          value={pain}
          onChange={(e) => setPain(e.target.value as PainValue | "")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Checkbox
          label="Visible undigested food"
          checked={visibleFood}
          onChange={(e) => setVisibleFood(e.target.checked)}
        />
        <div
          className={[
            "rounded-core-sm p-3 ring-1 transition-colors duration-200",
            bloodFlag ? "ring-claret-200" : "ring-transparent",
          ].join(" ")}
        >
          <Checkbox
            label="Blood present"
            checked={bloodFlag}
            onChange={(e) => setBloodFlag(e.target.checked)}
          />
          <AnimatePresence>
            {bloodFlag ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="mt-2 font-mono text-small text-claret-600">
                  Flagged sessions appear in your doctor export.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <SymptomChips value={symptoms} onChange={setSymptoms} />

      <PhotoField
        onSuggestion={handleSuggestion}
        onPhotoChange={(state) => {
          setPhotoDataUrl(state.photoDataUrl);
          setKeepPhoto(state.keepPhoto);
        }}
      />

      {error ? <p className="text-small text-claret-600">{error}</p> : null}

      <PressButton type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save Details"}
      </PressButton>
    </form>
  );
}
