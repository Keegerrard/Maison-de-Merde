"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import PressButton from "../ui/PressButton";
import DetailLogForm from "./DetailLogForm";
import { apiFetch, ApiError } from "@/lib/api";
import { EASE, SPRING } from "@/lib/motion";
import type { SessionCreateResponse } from "@/lib/types";

export default function QuickLogCard({
  onLogged,
}: {
  onLogged: (response: SessionCreateResponse) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  async function handleQuickLog() {
    setQuickSubmitting(true);
    setQuickError(null);
    try {
      const response = await apiFetch<SessionCreateResponse>(
        "/api/sessions",
        { method: "POST", body: {} }
      );
      onLogged(response);
    } catch (err) {
      setQuickError(
        err instanceof ApiError ? err.message : "Could not save this session."
      );
    } finally {
      setQuickSubmitting(false);
    }
  }

  return (
    <DoubleBezelCard>
      <h2 className="font-display text-title text-ink-900">
        Log a session.
      </h2>
      <p className="mt-2 max-w-[46ch] text-body text-ink-500">
        One tap records it now. Details can follow, or not.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <PressButton
          type="button"
          fullWidth
          className="sm:w-auto"
          disabled={quickSubmitting}
          onClick={handleQuickLog}
        >
          Enregistrer maintenant
        </PressButton>
        <PressButton
          type="button"
          variant="ghost"
          fullWidth
          className="sm:w-auto"
          onClick={() => setDetailOpen((v) => !v)}
        >
          Ajouter les détails
        </PressButton>
      </div>

      {quickError ? (
        <p className="mt-3 text-small text-claret-600">{quickError}</p>
      ) : null}

      <AnimatePresence initial={false}>
        {detailOpen ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: SPRING.layout }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { duration: 0.2, ease: EASE.out },
            }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.3, delay: 0.06, ease: EASE.out },
              }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="pt-6"
            >
              <DetailLogForm
                onSuccess={(response) => {
                  setDetailOpen(false);
                  onLogged(response);
                }}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </DoubleBezelCard>
  );
}
