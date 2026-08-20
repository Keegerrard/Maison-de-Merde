"use client";

import { useState } from "react";
import Icon from "../ui/Icon";
import PressButton from "../ui/PressButton";
import { usePremium } from "@/hooks/usePremium";
import { useToast } from "@/hooks/useToast";
import { useLanguage } from "@/hooks/useLanguage";
import FreezeDialog from "./FreezeDialog";

const GOLD_TAG =
  "rounded-pill bg-ink-900 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-paper";

export default function GoldCircleActions() {
  const { t } = useLanguage();
  const { gateWithPaywall } = usePremium();
  const { toast } = useToast();
  const [freezeOpen, setFreezeOpen] = useState(false);

  function handleFreeze() {
    gateWithPaywall(t("gold.freezeReason"), () => setFreezeOpen(true));
  }

  function handleRecover() {
    gateWithPaywall(t("gold.recoverReason"), () => {
      toast(t("gold.recoverToast"));
    });
  }

  return (
    <>
      <div className="rounded-shell bg-paper-sunk p-5 ring-1 ring-rule md:p-6">
        <p className="mb-4 font-mono text-eyebrow uppercase text-ink-300">
          {t("gold.reserved")}
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
                {t("gold.freezeStreak")}
              </span>
              <span className={GOLD_TAG}>{t("gold.tag")}</span>
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
                {t("gold.recoverDay")}
              </span>
              <span className={GOLD_TAG}>{t("gold.tag")}</span>
            </span>
          </PressButton>
        </div>
      </div>
      <FreezeDialog open={freezeOpen} onClose={() => setFreezeOpen(false)} />
    </>
  );
}
