"use client";

import { createContext, useContext } from "react";
import type { DashboardResponse } from "@/lib/types";

export interface DashboardContextValue {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// A single shared /api/dashboard fetch, provided once by AppShell and
// consumed by the streak pill, dashboard tab, and achievements tab — so
// switching between those tabs never triggers a duplicate request.
export const DashboardContext = createContext<DashboardContextValue | null>(
  null
);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within AppShell.");
  }
  return ctx;
}
