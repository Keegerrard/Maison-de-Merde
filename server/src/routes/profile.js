const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");
const { loadUserStats } = require("../statsHelpers");
const { calcStreak, BADGES, toISODateString, toISOStringSafe } = require("../streak");

const router = express.Router();
router.use(requireAuth);

// Kept in sync with web/lib/enums.ts BANNERS — validated here too so a
// tampered client request can't write an arbitrary string into the column.
const BANNERS = ["sage", "claret", "ink", "gold", "rose", "slate"];

function badgeMeta(id) {
  const b = BADGES.find((x) => x.id === id);
  return b ? { id: b.id, icon: b.icon, name: b.name, desc: b.desc } : null;
}

async function computeStats(userId) {
  const { user, sessions, unlockedIds } = await loadUserStats(userId);
  const timestamps = sessions.map((s) => toISOStringSafe(s.occurred_at));
  const streak = calcStreak(timestamps, user.grace_tokens, toISODateString(user.streak_freeze_until));
  return {
    totalSessions: sessions.length,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    badgesUnlocked: unlockedIds.size,
    unlockedIds,
  };
}

async function loadOrCreateProfile(userId) {
  const res = await query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  if (res.rows.length) return res.rows[0];
  return { user_id: userId, nickname: null, banner: "sage", trait_badge_id: null, is_public: false };
}

// GET /api/profile — my own full profile + stats.
router.get("/", async (req, res) => {
  try {
    const userRes = await query("SELECT username, created_at FROM users WHERE id = $1", [req.userId]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });

    const profile = await loadOrCreateProfile(req.userId);
    const stats = await computeStats(req.userId);

    res.json({
      username: user.username,
      nickname: profile.nickname || null,
      banner: profile.banner || "sage",
      traitBadgeId: profile.trait_badge_id || null,
      trait: profile.trait_badge_id ? badgeMeta(profile.trait_badge_id) : null,
      isPublic: !!profile.is_public,
      joinedAt: toISOStringSafe(user.created_at),
      stats: {
        totalSessions: stats.totalSessions,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        badgesUnlocked: stats.badgesUnlocked,
        badgesTotal: BADGES.length,
      },
      unlockedBadges: BADGES.filter((b) => stats.unlockedIds.has(b.id)).map((b) => ({
        id: b.id,
        icon: b.icon,
        name: b.name,
        desc: b.desc,
      })),
    });
  } catch (e) {
    console.error("get profile error", e);
    res.status(500).json({ error: "Failed to load profile." });
  }
});

// PATCH /api/profile { nickname?, banner?, traitBadgeId?, isPublic? }
router.patch("/", async (req, res) => {
  const b = req.body || {};
  try {
    const profile = await loadOrCreateProfile(req.userId);

    let nickname = profile.nickname;
    if ("nickname" in b) {
      const trimmed = (b.nickname || "").trim().slice(0, 40);
      nickname = trimmed || null;
    }

    let banner = profile.banner || "sage";
    if ("banner" in b) {
      if (!BANNERS.includes(b.banner)) return res.status(400).json({ error: "Invalid banner." });
      banner = b.banner;
    }

    let traitBadgeId = profile.trait_badge_id;
    if ("traitBadgeId" in b) {
      if (b.traitBadgeId === null || b.traitBadgeId === "") {
        traitBadgeId = null;
      } else {
        const { unlockedIds } = await loadUserStats(req.userId);
        if (!unlockedIds.has(b.traitBadgeId)) {
          return res.status(400).json({ error: "You can only display a distinction you've actually unlocked." });
        }
        traitBadgeId = b.traitBadgeId;
      }
    }

    let isPublic = !!profile.is_public;
    if ("isPublic" in b) isPublic = !!b.isPublic;

    await query(
      `INSERT INTO profiles (user_id, nickname, banner, trait_badge_id, is_public, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         nickname = $2, banner = $3, trait_badge_id = $4, is_public = $5, updated_at = $6`,
      [req.userId, nickname, banner, traitBadgeId, isPublic, new Date().toISOString()]
    );

    res.json({ nickname, banner, traitBadgeId, trait: traitBadgeId ? badgeMeta(traitBadgeId) : null, isPublic });
  } catch (e) {
    console.error("update profile error", e);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// GET /api/profile/:username — someone else's card. Visible if they've
// marked their profile public, or if you're an accepted friend of theirs;
// otherwise 403. Always visible to yourself.
router.get("/:username", async (req, res) => {
  const username = (req.params.username || "").trim();
  try {
    const userRes = await query("SELECT id, username, created_at FROM users WHERE username = $1", [username]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: "No user with that username." });

    if (user.id !== req.userId) {
      const profile = await loadOrCreateProfile(user.id);
      if (!profile.is_public) {
        const friendCheck = await query(
          "SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = 'accepted'",
          [req.userId, user.id]
        );
        if (!friendCheck.rows.length) {
          return res.status(403).json({ error: `${username}'s profile is private.` });
        }
      }
    }

    const profile = await loadOrCreateProfile(user.id);
    const stats = await computeStats(user.id);

    res.json({
      username: user.username,
      nickname: profile.nickname || null,
      banner: profile.banner || "sage",
      trait: profile.trait_badge_id ? badgeMeta(profile.trait_badge_id) : null,
      joinedAt: toISOStringSafe(user.created_at),
      stats: {
        totalSessions: stats.totalSessions,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        badgesUnlocked: stats.badgesUnlocked,
        badgesTotal: BADGES.length,
      },
    });
  } catch (e) {
    console.error("get public profile error", e);
    res.status(500).json({ error: "Failed to load profile." });
  }
});

module.exports = router;
