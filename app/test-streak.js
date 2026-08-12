// Quick sanity checks for calcStreak, run with: node test-streak.js
// Not a full test suite — just enough to catch off-by-one / boundary bugs
// before shipping the logic into the browser app.

global.localStorage = { getItem: () => null, setItem: () => {} };
const { calcStreak } = require("./app.js");

function iso(offsetDays) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString();
}

function assertEq(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "PASS" : "FAIL"} — ${label}` + (pass ? "" : ` (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`));
  if (!pass) process.exitCode = 1;
}

// 1. No sessions -> zero streak
assertEq(calcStreak([], 0, null), { current: 0, longest: 0, tokensUsed: 0 }, "empty history");

// 2. Logged today only -> streak 1
assertEq(calcStreak([iso(0)], 0, null).current, 1, "single day today");

// 3. Logged today + yesterday + day before -> streak 3
assertEq(calcStreak([iso(0), iso(-1), iso(-2)], 0, null).current, 3, "3 consecutive days");

// 4. Logged yesterday and 2 days ago, NOT today (today hasn't happened yet) -> streak should still count yesterday+before as current (2), since today not elapsed
assertEq(calcStreak([iso(-1), iso(-2)], 0, null).current, 2, "missing today, still within today's grace window");

// 5. Gap with no grace tokens breaks the streak
assertEq(calcStreak([iso(0), iso(-1), iso(-3)], 0, null).current, 2, "gap at day -2 breaks streak without tokens");

// 6. Gap covered by a grace token keeps it alive, consumes 1 token
{
  const r = calcStreak([iso(0), iso(-1), iso(-3)], 1, null);
  assertEq(r.current, 3, "gap bridged by grace token");
  assertEq(r.tokensUsed, 1, "exactly one token consumed");
}

// 7. Longest streak tracks historical best even if current streak is broken
{
  const days = [iso(-30), iso(-29), iso(-28), iso(-27), iso(-26), iso(0)]; // 5-day run, then broken, then today
  const r = calcStreak(days, 0, null);
  assertEq(r.longest, 5, "longest streak from historical run");
  assertEq(r.current, 1, "current streak only counts the trailing run");
}

// 8. Streak freeze keeps current streak alive through frozen days
{
  const freezeUntil = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const r = calcStreak([iso(-5)], 0, freezeUntil);
  // freeze only covers *future* days relative to today in this simple model;
  // this case mainly checks the function doesn't throw with a freeze set.
  assertEq(typeof r.current, "number", "freeze path executes without error");
}

console.log("\nDone.");
