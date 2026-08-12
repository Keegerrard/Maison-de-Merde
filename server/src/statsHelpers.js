const { query } = require("./db");
const { calcStreak, maybeGrantGraceToken, checkAchievements, todayISO, toISODateString } = require("./streak");

/** Fetch everything needed to compute streak + achievements for one user. */
async function loadUserStats(userId) {
  const userRes = await query(
    "SELECT id, grace_tokens, last_grace_grant_streak, streak_freeze_until FROM users WHERE id = $1",
    [userId]
  );
  const user = userRes.rows[0];
  if (!user) throw new Error("User not found");

  const sessionsRes = await query(
    "SELECT occurred_at, bristol_type, ai_suggested FROM sessions_log WHERE user_id = $1 ORDER BY occurred_at ASC",
    [userId]
  );
  const sessions = sessionsRes.rows;

  const badgesRes = await query("SELECT badge_id FROM badges_granted WHERE user_id = $1", [userId]);
  const unlockedIds = new Set(badgesRes.rows.map((r) => r.badge_id));

  return { user, sessions, unlockedIds };
}

/**
 * After a new session is logged, recompute streak, possibly grant a grace
 * token, and check/persist any newly-unlocked achievements. Returns the
 * updated streak info and the list of newly unlocked badges.
 */
async function recomputeAfterNewSession(userId) {
  const { user, sessions, unlockedIds } = await loadUserStats(userId);

  const timestamps = sessions.map((s) => s.occurred_at.toISOString());
  const streak = calcStreak(timestamps, user.grace_tokens, toISODateString(user.streak_freeze_until));

  const graceRecord = {
    grace_tokens: user.grace_tokens,
    last_grace_grant_streak: user.last_grace_grant_streak,
  };
  const graceGranted = maybeGrantGraceToken(streak.current, graceRecord);
  if (graceGranted) {
    await query("UPDATE users SET grace_tokens = $1, last_grace_grant_streak = $2 WHERE id = $3", [
      graceRecord.grace_tokens,
      graceRecord.last_grace_grant_streak,
      userId,
    ]);
  }

  const ctx = {
    totalSessions: sessions.length,
    analyzedSessions: sessions.filter((s) => s.bristol_type !== null).length,
    hasAiPhoto: sessions.some((s) => s.ai_suggested),
    longest: streak.longest,
  };
  const newlyUnlocked = checkAchievements(ctx, unlockedIds);
  for (const badge of newlyUnlocked) {
    await query(
      "INSERT INTO badges_granted (user_id, badge_id) VALUES ($1, $2) ON CONFLICT (user_id, badge_id) DO NOTHING",
      [userId, badge.id]
    );
  }

  return { streak, newlyUnlocked, graceGranted, graceTokens: graceRecord.grace_tokens };
}

module.exports = { loadUserStats, recomputeAfterNewSession };
