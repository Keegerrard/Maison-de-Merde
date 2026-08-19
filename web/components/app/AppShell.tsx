"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardContext } from "@/hooks/useDashboard";
import { PremiumContext, PREMIUM_STORAGE_KEY } from "@/hooks/usePremium";
import { apiFetch } from "@/lib/api";
import type { BadgeSummary, DashboardResponse } from "@/lib/types";
import AuthPanel from "./AuthPanel";
import TopBar from "./TopBar";
import LogPanel from "./LogPanel";
import DashboardPanel from "./DashboardPanel";
import CirclePanel from "./CirclePanel";
import AchievementsPanel from "./AchievementsPanel";
import GoldCirclePaywall from "./GoldCirclePaywall";
import CelebrationModal from "./CelebrationModal";
import SessionDetailModal from "./SessionDetailModal";
import ShareSessionModal from "./ShareSessionModal";
import ChatModal from "./ChatModal";
import ProfileModal from "./ProfileModal";
import SkeletonBlock from "../ui/SkeletonBlock";
import type { TabId } from "./TabRail";

const TAB_STORAGE_KEY = "mdm_tab";
const VALID_TABS: TabId[] = ["log", "dashboard", "circle", "achievements"];

export default function AppShell() {
  const { status, user, login, signup, logout } = useAuth();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<TabId>("log");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [paramsApplied, setParamsApplied] = useState(false);

  // Skeleton only appears if the auth check takes longer than 200ms.
  useEffect(() => {
    if (status !== "checking") {
      setShowSkeleton(false);
      return;
    }
    const t = window.setTimeout(() => setShowSkeleton(true), 200);
    return () => window.clearTimeout(t);
  }, [status]);

  // Read ?tab= / ?intent=signup&username= once, then fall back to
  // sessionStorage for subsequent renders/reloads.
  useEffect(() => {
    if (paramsApplied) return;
    const queryTab = searchParams.get("tab");
    if (queryTab && VALID_TABS.includes(queryTab as TabId)) {
      setTab(queryTab as TabId);
    } else {
      const stored = window.sessionStorage.getItem(TAB_STORAGE_KEY);
      if (stored && VALID_TABS.includes(stored as TabId)) {
        setTab(stored as TabId);
      }
    }
    setParamsApplied(true);
  }, [paramsApplied, searchParams]);

  useEffect(() => {
    if (paramsApplied) {
      window.sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    }
  }, [tab, paramsApplied]);

  const intent = searchParams.get("intent");
  const usernameParam = searchParams.get("username") ?? "";

  // ---- Dashboard (single shared fetch) ----
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const refreshDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const data = await apiFetch<DashboardResponse>("/api/dashboard");
      setDashboardData(data);
    } catch {
      setDashboardError("Failed to load dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authed") {
      refreshDashboard();
    }
  }, [status, refreshDashboard]);

  const dashboardValue = useMemo(
    () => ({
      data: dashboardData,
      loading: dashboardLoading,
      error: dashboardError,
      refresh: refreshDashboard,
    }),
    [dashboardData, dashboardLoading, dashboardError, refreshDashboard]
  );

  // ---- Premium / paywall gate ----
  const [isPremium, setIsPremium] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(
    null
  );

  useEffect(() => {
    setIsPremium(window.localStorage.getItem(PREMIUM_STORAGE_KEY) === "1");
  }, []);

  const gateWithPaywall = useCallback(
    (reason: string, action: () => void) => {
      if (isPremium) {
        action();
        return;
      }
      setPaywallReason(reason);
      setPendingAction(() => action);
      setPaywallOpen(true);
    },
    [isPremium]
  );

  const premiumValue = useMemo(
    () => ({ isPremium, gateWithPaywall }),
    [isPremium, gateWithPaywall]
  );

  function handleSubscribed() {
    window.localStorage.setItem(PREMIUM_STORAGE_KEY, "1");
    setIsPremium(true);
    pendingAction?.();
    setPendingAction(null);
  }

  // ---- Achievement celebration queue ----
  const [celebrationQueue, setCelebrationQueue] = useState<BadgeSummary[]>([]);

  const enqueueCelebrations = useCallback((badges: BadgeSummary[]) => {
    if (badges.length === 0) return;
    setCelebrationQueue((prev) => [...prev, ...badges]);
  }, []);

  function dismissCelebration() {
    setCelebrationQueue((prev) => prev.slice(1));
  }

  // ---- Session detail / share / chat / profile overlays ----
  const [detailSessionId, setDetailSessionId] = useState<number | null>(null);
  const [shareSessionId, setShareSessionId] = useState<number | null>(null);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  function handleOpenSession(id: number) {
    setDetailSessionId(id);
  }
  function handleShareFromDetail(id: number) {
    setDetailSessionId(null);
    setShareSessionId(id);
  }
  function handleOpenChat(username: string) {
    setChatWith(username);
  }
  function handleOpenCircleFromNotification() {
    setTab("circle");
  }

  if (status === "checking") {
    return showSkeleton ? (
      <div className="grid min-h-[100dvh] place-items-center">
        <SkeletonBlock className="h-40 w-72" />
      </div>
    ) : null;
  }

  if (status === "anon") {
    return (
      <AuthPanel
        onLogin={login}
        onSignup={signup}
        initialTab={intent === "signup" ? "signup" : "login"}
        initialUsername={usernameParam}
      />
    );
  }

  return (
    <DashboardContext.Provider value={dashboardValue}>
      <PremiumContext.Provider value={premiumValue}>
        <div className="min-h-[100dvh] pb-20 md:pb-0">
          <TopBar
            active={tab}
            onChangeTab={setTab}
            onLogout={logout}
            isPremium={isPremium}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenChat={handleOpenChat}
            onOpenCircle={handleOpenCircleFromNotification}
          />
          <main className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-10 md:py-12">
            {tab === "log" ? (
              <LogPanel
                onNewlyUnlocked={enqueueCelebrations}
                onOpenSession={handleOpenSession}
              />
            ) : null}
            {tab === "dashboard" ? <DashboardPanel /> : null}
            {tab === "circle" ? (
              <CirclePanel onOpenChat={handleOpenChat} onOpenSession={handleOpenSession} />
            ) : null}
            {tab === "achievements" ? <AchievementsPanel /> : null}
          </main>
        </div>

        <GoldCirclePaywall
          open={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          reason={paywallReason}
          onSubscribed={handleSubscribed}
        />
        <CelebrationModal
          badge={celebrationQueue[0] ?? null}
          onDismiss={dismissCelebration}
        />
        <SessionDetailModal
          sessionId={detailSessionId}
          onClose={() => setDetailSessionId(null)}
          onShare={handleShareFromDetail}
        />
        <ShareSessionModal
          sessionId={shareSessionId}
          onClose={() => setShareSessionId(null)}
        />
        <ChatModal username={chatWith} onClose={() => setChatWith(null)} />
        <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
        <div id="print-card-root" />
      </PremiumContext.Provider>
    </DashboardContext.Provider>
  );
}
