"use client";

import { Suspense } from "react";
import AppShell from "@/components/app/AppShell";

export default function AppRoute() {
  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  );
}
