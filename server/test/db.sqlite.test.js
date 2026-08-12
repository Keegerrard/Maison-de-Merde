/* =========================================================================
   Real end-to-end test of the zero-setup local dev path: no DATABASE_URL,
   no mocking — this is exactly what happens when someone runs
   `npm install && npm start` with no .env file at all. Uses the actual
   sql.js-backed SQLite fallback in src/db.js against a throwaway file.

   test/db.test.js already covers the same scenarios against the pg-mem
   mock (i.e. "does the Postgres-path SQL work"); this file exists so the
   SQLite fallback specifically — the one most people will actually hit
   when just trying the app out — gets the same level of verification,
   not just a syntax check.
   ========================================================================= */

const fs = require("fs");
const path = require("path");

delete process.env.DATABASE_URL; // force the sqlite branch in src/db.js
process.env.JWT_SECRET = "test-secret-do-not-use-in-prod";
process.env.NODE_ENV = "test";
// Unique path per run (pid + timestamp) so a crashed/timed-out previous run
// can never leave stale data (e.g. a "marcus" user that already exists)
// that would make this run's assertions fail for the wrong reason.
process.env.SQLITE_PATH = path.join(__dirname, `.sqlite-e2e-test.${process.pid}.${Date.now()}.db`);

const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");

const { runMigrations } = require("../src/migrate");
const { driver } = require("../src/db");
const authRoutes = require("../src/routes/auth");
const sessionsRoutes = require("../src/routes/sessions");
const dashboardRoutes = require("../src/routes/dashboard");
const circleRoutes = require("../src/routes/circle");
const visionRoutes = require("../src/routes/vision");

let failures = 0;
function assert(cond, label) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${label}`);
  if (!cond) failures++;
}

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRoutes);
  app.use("/api/sessions", sessionsRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/circle", circleRoutes);
  app.use("/api/vision", visionRoutes);
  return app;
}

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  return setCookie ? setCookie.split(";")[0] : null;
}

async function main() {
  assert(driver === "sqlite", `driver auto-selected sqlite with no DATABASE_URL (got "${driver}")`);

  await runMigrations();
  assert(fs.existsSync(process.env.SQLITE_PATH), "sqlite file was created on disk after migrations");

  const app = makeApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;

  // Signup
  let res = await fetch(`${base}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "marcus", email: "marcus@example.com", password: "correcthorse1" }),
  });
  assert(res.status === 201, "signup returns 201");
  const cookie1 = extractCookie(res);

  // Quick log
  res = await fetch(`${base}/sessions`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie1 }, body: "{}" });
  assert(res.status === 201, "quick log returns 201");
  let body = await res.json();
  assert(body.streak.current === 1, `streak.current is 1 after first log (got ${body.streak.current})`);
  assert(body.newlyUnlocked.some((b) => b.id === "milestone_first"), "first-log badge unlocked");

  // Detailed log with symptoms (exercises the JSON-encoded symptoms column)
  res = await fetch(`${base}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ bristolType: 6, color: "green", odor: "strong", pain: "mild", symptoms: ["bloating", "urgency"], notes: "ate too much spicy food" }),
  });
  assert(res.status === 201, "detailed log with symptoms returns 201");

  // Sessions list round-trips symptoms as a real array, not a JSON string
  res = await fetch(`${base}/sessions?limit=5`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  const withSymptoms = body.sessions.find((s) => s.bristol_type === 6);
  assert(Array.isArray(withSymptoms.symptoms) && withSymptoms.symptoms.includes("bloating"), `symptoms round-trip as an array (got ${JSON.stringify(withSymptoms && withSymptoms.symptoms)})`);

  // Dashboard reflects both sessions, correct Bristol bucket
  res = await fetch(`${base}/dashboard`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(body.totalSessions === 2, `dashboard totalSessions is 2 (got ${body.totalSessions})`);
  assert(body.bristolCounts[5] === 1, "bristolCounts[5] (Type 6) incremented");
  assert(Array.isArray(body.heatmap) && body.heatmap.length === 91, `dashboard returns a 91-day heatmap array (got length ${body.heatmap && body.heatmap.length})`);
  assert(typeof body.streak.current === "number", "dashboard streak.current is a number, not a Date/object bug");

  // Streak freeze round-trips a plain date string
  res = await fetch(`${base}/dashboard/freeze`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie1 }, body: JSON.stringify({ days: 3 }) });
  body = await res.json();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(body.streakFreezeUntil), `freeze returns a plain YYYY-MM-DD string (got ${body.streakFreezeUntil})`);

  // Doctor export doesn't crash and contains expected content
  res = await fetch(`${base}/dashboard/export`, { headers: { Cookie: cookie1 } });
  const text = await res.text();
  assert(res.status === 200 && text.includes("Total sessions logged: 2"), "doctor export returns a real summary");

  // Second user + friend/circle flow, same as the pg-mem test, to make sure
  // the JOIN-based circle query works against real SQLite too.
  res = await fetch(`${base}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "priya", email: "priya@example.com", password: "correcthorse2" }),
  });
  const cookie2 = extractCookie(res);
  await fetch(`${base}/sessions`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie2 }, body: "{}" });

  await fetch(`${base}/circle/friends`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie1 }, body: JSON.stringify({ username: "priya" }) });
  res = await fetch(`${base}/circle/requests`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  const requesterId = body.requests[0].id;
  await fetch(`${base}/circle/requests/${requesterId}/accept`, { method: "POST", headers: { Cookie: cookie2 } });

  res = await fetch(`${base}/circle`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(body.leaderboard.length === 2, `circle shows 2 people after accept (got ${body.leaderboard.length})`);

  server.close();
  try { fs.unlinkSync(process.env.SQLITE_PATH); } catch (e) { /* best-effort cleanup */ }

  console.log(failures === 0 ? "\nAll db.sqlite.test.js checks passed." : `\n${failures} check(s) FAILED.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error("TEST HARNESS THREW:", e);
  process.exitCode = 1;
});
