/* =========================================================================
   Streak + achievement logic — ported from the v1 client prototype.
   Kept as pure functions (no DB, no Express) so they stay unit-testable
   in isolation, same as the original app.js version. See test/streak.test.js.
   ========================================================================= */

function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(aISO, bISO) {
  const a = new Date(aISO + "T00:00:00Z");
  const b = new Date(bISO + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

/**
 * Normalizes a Postgres DATE value to a YYYY-MM-DD string. node-postgres
 * (and pg-mem) return DATE columns as JS Date objects, not strings — this
 * avoids relying on a ::text SQL cast, which pg-mem doesn't support for
 * date columns and which is one extra thing to get wrong across drivers.
 */
function toISODateString(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return null;
}

/**
 * Given a list of ISO datetime strings (session timestamps), grace tokens,
 * and an optional freeze-until date, compute { current, longest, tokensUsed }.
 */
function calcStreak(sessionTimestamps, graceTokens, freezeUntilISO) {
  const uniqueDays = new Set(sessionTimestamps.map((t) => t.slice(0, 10)));
  if (uniqueDays.size === 0) return { current: 0, longest: 0, tokensUsed: 0 };

  const sortedDays = Array.from(uniqueDays).sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const gap = daysBetween(sortedDays[i - 1], sortedDays[i]);
    if (gap === 1) run += 1;
    else if (gap === 0) continue;
    else run = 1;
    longest = Math.max(longest, run);
  }

  const today = todayISO();
  let tokensAvailable = graceTokens;
  let tokensUsed = 0;
  let current = 0;
  let cursor = today;

  while (true) {
    const hasSession = uniqueDays.has(cursor);
    const frozen = freezeUntilISO && cursor <= freezeUntilISO && cursor >= todayISO();
    const step = () => {
      cursor = todayISO(new Date(new Date(cursor + "T00:00:00Z").getTime() - 86400000));
    };
    if (hasSession) { current += 1; step(); continue; }
    if (cursor === today) { step(); continue; }
    if (frozen) { step(); continue; }
    if (tokensAvailable > 0) { tokensAvailable -= 1; tokensUsed += 1; step(); continue; }
    break;
  }

  return { current, longest, tokensUsed };
}

/** Earn 1 grace token every 14-day streak milestone, capped at 3. Mutates the passed record. */
function maybeGrantGraceToken(streakCurrent, record) {
  const milestonesPassed = Math.floor(streakCurrent / 14);
  const alreadyGranted = Math.floor(record.last_grace_grant_streak / 14);
  let granted = false;
  if (milestonesPassed > alreadyGranted && record.grace_tokens < 3) {
    record.grace_tokens = Math.min(3, record.grace_tokens + 1);
    record.last_grace_grant_streak = streakCurrent;
    granted = true;
  }
  return granted;
}

const BADGES = [
  { id: "milestone_first", icon: "🎉", name: "First Log", desc: "Logged your first session.",
    check: (ctx) => ctx.totalSessions >= 1 },
  { id: "streak_7", icon: "🔥", name: "Week Warrior", desc: "7-day streak.",
    check: (ctx) => ctx.longest >= 7 },
  { id: "streak_30", icon: "🔥🔥", name: "Month Machine", desc: "30-day streak.",
    check: (ctx) => ctx.longest >= 30 },
  { id: "streak_100", icon: "💯", name: "Centurion", desc: "100-day streak.",
    check: (ctx) => ctx.longest >= 100 },
  { id: "streak_365", icon: "🏆", name: "Year One", desc: "365-day streak.",
    check: (ctx) => ctx.longest >= 365 },
  { id: "completeness_10", icon: "📋", name: "Thorough", desc: "10 full analyses logged.",
    check: (ctx) => ctx.analyzedSessions >= 10 },
  { id: "completeness_50", icon: "📊", name: "Data Nerd", desc: "50 full analyses logged.",
    check: (ctx) => ctx.analyzedSessions >= 50 },
  { id: "milestone_100_sessions", icon: "💩", name: "Triple Digits", desc: "100 sessions logged.",
    check: (ctx) => ctx.totalSessions >= 100 },
  { id: "milestone_first_photo", icon: "📸", name: "Say Cheese", desc: "First AI-analyzed photo.",
    check: (ctx) => ctx.hasAiPhoto },
];

/**
 * ctx: { totalSessions, analyzedSessions, hasAiPhoto, longest }
 * alreadyUnlockedIds: Set<string>
 * Returns the list of badge defs newly unlocked (does not mutate anything —
 * caller is responsible for persisting the grants).
 */
function checkAchievements(ctx, alreadyUnlockedIds) {
  const newly = [];
  for (const badge of BADGES) {
    if (!alreadyUnlockedIds.has(badge.id) && badge.check(ctx)) {
      newly.push(badge);
    }
  }
  return newly;
}

module.exports = { calcStreak, maybeGrantGraceToken, checkAchievements, BADGES, todayISO, daysBetween, toISODateString };
