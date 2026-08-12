// Same test cases as the v1 client prototype's test-streak.js, run against
// the ported server-side src/streak.js to make sure nothing broke moving it.

const { calcStreak, checkAchievements, maybeGrantGraceToken } = require("../src/streak");

function iso(offsetDays) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString();
}

let failures = 0;
function assertEq(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "PASS" : "FAIL"} — ${label}` + (pass ? "" : ` (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`));
  if (!pass) failures++;
}

assertEq(calcStreak([], 0, null), { current: 0, longest: 0, tokensUsed: 0 }, "empty history");
assertEq(calcStreak([iso(0)], 0, null).current, 1, "single day today");
assertEq(calcStreak([iso(0), iso(-1), iso(-2)], 0, null).current, 3, "3 consecutive days");
assertEq(calcStreak([iso(-1), iso(-2)], 0, null).current, 2, "missing today, still within grace window");
assertEq(calcStreak([iso(0), iso(-1), iso(-3)], 0, null).current, 2, "gap breaks streak without tokens");
{
  const r = calcStreak([iso(0), iso(-1), iso(-3)], 1, null);
  assertEq(r.current, 3, "gap bridged by grace token");
  assertEq(r.tokensUsed, 1, "exactly one token consumed");
}
{
  const days = [iso(-30), iso(-29), iso(-28), iso(-27), iso(-26), iso(0)];
  const r = calcStreak(days, 0, null);
  assertEq(r.longest, 5, "longest streak from historical run");
  assertEq(r.current, 1, "current streak only counts trailing run");
}

// Achievement gating
{
  const ctx = { totalSessions: 1, analyzedSessions: 0, hasAiPhoto: false, longest: 1 };
  const newly = checkAchievements(ctx, new Set());
  assertEq(newly.map((b) => b.id), ["milestone_first"], "first-session badge fires alone at session 1");
}
{
  const ctx = { totalSessions: 40, analyzedSessions: 12, hasAiPhoto: true, longest: 8 };
  const newly = checkAchievements(ctx, new Set(["milestone_first"]));
  const ids = newly.map((b) => b.id).sort();
  assertEq(ids, ["completeness_10", "milestone_first_photo", "streak_7"].sort(), "multiple badges unlock together, already-granted excluded");
}

// Grace token grant at 14-day milestones, capped at 3
{
  const record = { grace_tokens: 1, last_grace_grant_streak: 0 };
  const granted = maybeGrantGraceToken(14, record);
  assertEq(granted, true, "grace token granted at 14-day milestone");
  assertEq(record.grace_tokens, 2, "grace token count incremented");
  const grantedAgainSameStreak = maybeGrantGraceToken(14, record);
  assertEq(grantedAgainSameStreak, false, "no double-grant at same streak length");
}
{
  const record = { grace_tokens: 3, last_grace_grant_streak: 0 };
  const granted = maybeGrantGraceToken(14, record);
  assertEq(granted, false, "grace tokens cap at 3, no grant past cap");
}

console.log(failures === 0 ? "\nAll streak.test.js checks passed." : `\n${failures} check(s) FAILED.`);
process.exitCode = failures === 0 ? 0 : 1;
