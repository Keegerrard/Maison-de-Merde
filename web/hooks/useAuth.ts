"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AuthUser, LoginBody, SignupBody } from "@/lib/types";

export type AuthStatus = "checking" | "anon" | "authed";

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>("/api/auth/me");
      setUser(me);
      setStatus("authed");
    } catch {
      setUser(null);
      setStatus("anon");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (body: LoginBody) => {
    const me = await apiFetch<AuthUser>("/api/auth/login", {
      method: "POST",
      body: { remember: true, ...body },
    });
    setUser(me);
    setStatus("authed");
    return me;
  }, []);

  const signup = useCallback(async (body: SignupBody) => {
    const me = await apiFetch<AuthUser>("/api/auth/signup", {
      method: "POST",
      body,
    });
    setUser(me);
    setStatus("authed");
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setStatus("anon");
    }
  }, []);

  return { status, user, login, signup, logout, refresh };
}
