"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { MyProfileResponse, ProfileUpdateBody } from "@/lib/types";

export function useProfile() {
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<MyProfileResponse>("/api/profile");
      setProfile(data);
    } catch {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(async (body: ProfileUpdateBody) => {
    const res = await apiFetch<{
      nickname: string | null;
      banner: string;
      traitBadgeId: string | null;
      trait: MyProfileResponse["trait"];
      isPublic: boolean;
    }>("/api/profile", { method: "PATCH", body });
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            nickname: res.nickname,
            banner: res.banner as MyProfileResponse["banner"],
            traitBadgeId: res.traitBadgeId,
            trait: res.trait,
            isPublic: res.isPublic,
          }
        : prev
    );
    return res;
  }, []);

  return { profile, loading, error, refresh, update };
}
