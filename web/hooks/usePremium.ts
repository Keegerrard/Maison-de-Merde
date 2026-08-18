"use client";

import { createContext, useContext } from "react";

export const PREMIUM_STORAGE_KEY = "maison_de_merde_premium_v1";

export interface PremiumContextValue {
  isPremium: boolean;
  /**
   * Runs `action` immediately if the user already holds the (satirical,
   * demo-only) premium flag. Otherwise opens the Gold Circle paywall with
   * `reason` and queues `action` to run on a successful "subscribe."
   */
  gateWithPaywall: (reason: string, action: () => void) => void;
}

export const PremiumContext = createContext<PremiumContextValue | null>(null);

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error("usePremium must be used within AppShell.");
  }
  return ctx;
}
