"use client";

import { useState } from "react";
import Icon from "../ui/Icon";
import PressButton from "../ui/PressButton";
import { usePremium } from "@/hooks/usePremium";
import { useToast } from "@/hooks/useToast";
import FreezeDialog from "./FreezeDialog";

const GOLD_TAG =
  "rounded-pill bg-ink-900 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-paper";

export default function GoldCircleActions() {
  const { gateWithPaywall } = usePremium();
  const { toast } = useToast();
  const [freezeOpen, setFreezeOpen] = useState(false);

  function handleFreeze() {
    gateWithPaywall(
      "Streak Freeze is a privilege of the Gold Circle.",
      () => setFreezeOpen(true)
    );
  }

  function handleRecover() {
    gateWithPaywall(
      "Recovering a missed day is a privilege of the Gold Circle.",
      () => {
        toast(
          "A member of our staff has been dispatched to discreetly recover your missed day."
        );
      }
    );
  }

  return (
    <>
      <div className="rounded-shell bg-paper-sunk p-5 ring-1 ring-rule md:p-6">
        <p className="mb-4 font-mono text-eyebrow uppercase text-ink-300">
          Réservé aux membres du Cercle d&apos;Or
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PressButton
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleFreeze}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Icon name="Lock" size={16} strokeWidth={1.25} />
                Geler la série
              </span>
              <span className={GOLD_TAG}>Gold</span>
            </span>
          </PressButton>
          <PressButton
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleRecover}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Icon name="Lock" size={16} strokeWidth={1.25} />
                Récupérer un jour manqué
              </span>
              <span className={GOLD_TAG}>Gold</span>
            </span>
          </PressButton>
        </div>
      </div>
      <FreezeDialog open={freezeOpen} onClose={() => setFreezeOpen(false)} />
    </>
  );
}
