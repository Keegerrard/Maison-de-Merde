"use client";

import { useCallback, useState } from "react";
import QuickLogCard from "./QuickLogCard";
import SessionList from "./SessionList";
import { useSessions } from "@/hooks/useSessions";
import { useDashboard } from "@/hooks/useDashboard";
import type { BadgeSummary, SessionCreateResponse } from "@/lib/types";

// The celebration modal queue for `newlyUnlocked` badges is built in a
// later task (T21) at the AppShell level. `onNewlyUnlocked` is exposed here,
// optional and unused-safe, so that task can wire in without touching this
// file again.
export default function LogPanel({
  onNewlyUnlocked,
}: {
  onNewlyUnlocked?: (badges: BadgeSummary[]) => void;
}) {
  const { sessions, loading, refresh } = useSessions();
  const { refresh: refreshDashboard } = useDashboard();
  const [stampKey, setStampKey] = useState(0);
  const [showStamp, setShowStamp] = useState(false);

  const handleLogged = useCallback(
    (response: SessionCreateResponse) => {
      refresh();
      refreshDashboard();
      setStampKey((k) => k + 1);
      setShowStamp(true);
      if (response.newlyUnlocked.length > 0) {
        onNewlyUnlocked?.(response.newlyUnlocked);
      }
    },
    [refresh, refreshDashboard, onNewlyUnlocked]
  );

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <div className="flex flex-col gap-8 md:col-span-7">
        <QuickLogCard onLogged={handleLogged} />
      </div>
      <div className="md:col-span-5 md:sticky md:top-28 md:self-start">
        <SessionList
          sessions={sessions}
          loading={loading}
          stamp={
            showStamp
              ? { key: stampKey, onDone: () => setShowStamp(false) }
              : null
          }
        />
      </div>
    </div>
  );
}
