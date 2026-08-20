"use client";

import Chip from "../ui/Chip";
import { SYMPTOMS } from "@/lib/enums";
import { useLanguage } from "@/hooks/useLanguage";

// Client-side convention only (§0.3) — the server accepts any string[],
// truncated to 10. These four chips are what the UI offers; the cap is
// trivial to hit here but kept for parity with the server contract.
const MAX_SYMPTOMS = 10;

export default function SymptomChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { tEnum } = useLanguage();

  function toggle(symptom: string) {
    if (value.includes(symptom)) {
      onChange(value.filter((v) => v !== symptom));
    } else if (value.length < MAX_SYMPTOMS) {
      onChange([...value, symptom]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SYMPTOMS.map((symptom) => (
        <Chip
          key={symptom.value}
          type="button"
          label={tEnum("symptom", symptom.value, symptom.label)}
          selected={value.includes(symptom.value)}
          onClick={() => toggle(symptom.value)}
        />
      ))}
    </div>
  );
}
