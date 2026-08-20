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
const chatRoutes = require("../src/routes/chat");
const notificationsRoutes = require("../src/routes/notifications");
const profileRoutes = require("../src/routes/profile");

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
  app.use("/api/chat", chatRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/profile", profileRoutes);
  return app;
}

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  return setCookie ? setCookie.split(";")[0] : null;
}

let server = null;

async function main() {
  assert(driver === "sqlite", `driver auto-selected sqlite with no DATABASE_URL (got "${driver}")`);

  await runMigrations();
  assert(fs.existsSync(process.env.SQLITE_PATH), "sqlite file was created on disk after migrations");

  const app = makeApp();
  server = http.createServer(app);
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

  // --- Session detail + sharing ---
  res = await fetch(`${base}/sessions?limit=1`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  const sessionId = body.sessions[0].id;

  res = await fetch(`${base}/sessions/${sessionId}`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(res.status === 200 && body.isOwner === true, "owner can view full session detail");

  res = await fetch(`${base}/sessions/${sessionId}`, { headers: { Cookie: cookie2 } });
  assert(res.status === 403, `non-owner without a share is forbidden (got ${res.status})`);

  // Third user, not friended with marcus, to prove sharing is friends-only.
  res = await fetch(`${base}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "casey", email: "casey@example.com", password: "correcthorse3" }),
  });
  const cookie3 = extractCookie(res);
  res = await fetch(`${base}/sessions/${sessionId}/share`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie1 }, body: JSON.stringify({ username: "casey" }) });
  assert(res.status === 400, `sharing with a non-friend is rejected (got ${res.status})`);

  res = await fetch(`${base}/sessions/${sessionId}/share`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie1 }, body: JSON.stringify({ username: "priya" }) });
  assert(res.status === 201, `sharing with a friend succeeds (got ${res.status})`);

  res = await fetch(`${base}/sessions/${sessionId}`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(res.status === 200 && body.isOwner === false, "recipient can now view the shared session, not flagged as owner");

  res = await fetch(`${base}/sessions/shared`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(body.sessions.length === 1 && body.sessions[0].shared_by_username === "marcus", "shared-with-me list shows the session with the sharer's username");

  // --- Share caption + opt-in photo gating ---
  res = await fetch(`${base}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ bristolType: 4, keepPhoto: true, photoDataUrl: "data:image/png;base64,AAAA" }),
  });
  body = await res.json();
  const photoSessionId = body.session.id;

  res = await fetch(`${base}/sessions/${photoSessionId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ username: "priya", caption: "rough one today", includePhoto: false }),
  });
  assert(res.status === 201, "share with caption + includePhoto:false succeeds");

  res = await fetch(`${base}/sessions/${photoSessionId}`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(body.caption === "rough one today", `caption round-trips to the recipient (got ${JSON.stringify(body.caption)})`);
  assert(body.session.photo_kept === null, "photo withheld from recipient when includePhoto was false");

  res = await fetch(`${base}/sessions/${photoSessionId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ username: "priya", includePhoto: true }),
  });
  res = await fetch(`${base}/sessions/${photoSessionId}`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(!!body.session.photo_kept, "photo visible to recipient once re-shared with includePhoto:true");

  res = await fetch(`${base}/sessions/${photoSessionId}`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(!!body.session.photo_kept, "owner always sees their own kept photo regardless of share settings");

  // --- Chat (friends-only) ---
  res = await fetch(`${base}/chat/casey`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie1 }, body: JSON.stringify({ body: "hi" }) });
  assert(res.status === 400, `chatting with a non-friend is rejected (got ${res.status})`);

  res = await fetch(`${base}/chat/marcus`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie2 }, body: JSON.stringify({ body: "hey marcus" }) });
  assert(res.status === 201, `priya can message her friend marcus (got ${res.status})`);

  res = await fetch(`${base}/chat/priya`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(body.messages.length === 1 && body.messages[0].body === "hey marcus" && body.messages[0].isMine === false, "marcus sees priya's message, correctly flagged as not his own");

  res = await fetch(`${base}/chat/marcus`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(body.messages[0].isMine === true, "priya sees her own message flagged as hers");

  // --- Notifications ---
  res = await fetch(`${base}/notifications`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  const marcusTypes = body.notifications.map((n) => n.type);
  assert(marcusTypes.includes("friend_accept") && marcusTypes.includes("message"), `marcus has friend_accept + message notifications (got ${JSON.stringify(marcusTypes)})`);
  assert(body.unreadCount >= 2, `marcus has at least 2 unread notifications (got ${body.unreadCount})`);

  res = await fetch(`${base}/notifications`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  const priyaTypes = body.notifications.map((n) => n.type);
  assert(priyaTypes.includes("friend_request") && priyaTypes.includes("session_shared"), `priya has friend_request + session_shared notifications (got ${JSON.stringify(priyaTypes)})`);

  const firstNotifId = body.notifications[0].id;
  res = await fetch(`${base}/notifications/${firstNotifId}/read`, { method: "POST", headers: { Cookie: cookie2 } });
  assert(res.status === 200, "marking a single notification read succeeds");
  res = await fetch(`${base}/notifications`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(body.notifications.find((n) => n.id === firstNotifId).read === true, "that notification is now marked read");

  res = await fetch(`${base}/notifications/read-all`, { method: "POST", headers: { Cookie: cookie2 } });
  assert(res.status === 200, "mark-all-read succeeds");
  res = await fetch(`${base}/notifications`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(body.unreadCount === 0, `unread count is 0 after mark-all-read (got ${body.unreadCount})`);

  // --- Profile: own read/write, trait validation, public/private gating ---
  res = await fetch(`${base}/profile`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(res.status === 200 && body.username === "marcus" && body.isPublic === false, `default profile is private (got isPublic=${body.isPublic})`);
  assert(body.stats.totalSessions === 3, `profile stats reflect 3 logged sessions (got ${body.stats.totalSessions})`);

  res = await fetch(`${base}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ traitBadgeId: "streak_7" }),
  });
  assert(res.status === 400, "setting a trait for a badge you haven't unlocked is rejected");

  res = await fetch(`${base}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ nickname: "The Regular", banner: "gold", traitBadgeId: "milestone_first", isPublic: false }),
  });
  body = await res.json();
  assert(res.status === 200 && body.nickname === "The Regular" && body.banner === "gold" && body.traitBadgeId === "milestone_first", `profile update round-trips (got ${JSON.stringify(body)})`);

  res = await fetch(`${base}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ banner: "not-a-real-banner" }),
  });
  assert(res.status === 400, "an unknown banner value is rejected");

  // casey isn't friends with marcus and marcus's profile is still private
  res = await fetch(`${base}/profile/marcus`, { headers: { Cookie: cookie3 } });
  assert(res.status === 403, `a non-friend can't view a private profile (got ${res.status})`);

  // priya IS friends with marcus, so she can see it despite it being private
  res = await fetch(`${base}/profile/marcus`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(res.status === 200 && body.nickname === "The Regular", "a friend can view a private profile");

  res = await fetch(`${base}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ isPublic: true }),
  });
  res = await fetch(`${base}/profile/marcus`, { headers: { Cookie: cookie3 } });
  assert(res.status === 200, "a stranger can view the profile once it's made public");

  // --- Change username ---
  res = await fetch(`${base}/auth/username`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ newUsername: "marcus2", password: "wrong-password" }),
  });
  assert(res.status === 401, `changing username with the wrong password is rejected (got ${res.status})`);

  res = await fetch(`${base}/auth/username`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ newUsername: "priya", password: "correcthorse1" }),
  });
  assert(res.status === 409, `changing username to one already taken is rejected (got ${res.status})`);

  res = await fetch(`${base}/auth/username`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ newUsername: "marcus2", password: "correcthorse1" }),
  });
  body = await res.json();
  assert(res.status === 200 && body.username === "marcus2", `username change succeeds (got ${JSON.stringify(body)})`);

  res = await fetch(`${base}/auth/me`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(body.username === "marcus2", "the existing session cookie still works and reflects the new username");

  res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "marcus2", password: "correcthorse1" }),
  });
  assert(res.status === 200, "can log back in with the new username");

  // --- Forgot / reset password ---
  res = await fetch(`${base}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "nobody_at_all" }),
  });
  body = await res.json();
  assert(res.status === 200 && body.delivered === false && !body.resetToken, "forgot-password for an unknown account doesn't leak whether it exists");

  res = await fetch(`${base}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "marcus2" }),
  });
  body = await res.json();
  assert(res.status === 200 && typeof body.resetToken === "string" && body.resetToken.length > 20, `forgot-password for a real account returns a reset token (got ${JSON.stringify(body)})`);
  const resetToken = body.resetToken;

  res = await fetch(`${base}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "not-a-real-token", newPassword: "newpassword1" }),
  });
  assert(res.status === 400, `resetting with a bogus token is rejected (got ${res.status})`);

  res = await fetch(`${base}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, newPassword: "newpassword1" }),
  });
  assert(res.status === 200, `resetting with a valid token succeeds (got ${res.status})`);

  res = await fetch(`${base}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, newPassword: "anotherpassword2" }),
  });
  assert(res.status === 400, "the same reset token cannot be reused");

  res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "marcus2", password: "correcthorse1" }),
  });
  assert(res.status === 401, "the old password no longer works after reset");

  res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "marcus2", password: "newpassword1" }),
  });
  assert(res.status === 200, "logging in with the new password works");

  // --- Remember me: cookie persistence is opt-out via remember:false ---
  res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "casey", password: "correcthorse3", remember: false }) });
  let rawSetCookie = res.headers.get("set-cookie") || "";
  assert(res.status === 200 && !/Max-Age/i.test(rawSetCookie), `remember:false issues a session-only cookie with no Max-Age (got "${rawSetCookie}")`);

  res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "casey", password: "correcthorse3", remember: true }) });
  rawSetCookie = res.headers.get("set-cookie") || "";
  assert(res.status === 200 && /Max-Age/i.test(rawSetCookie), `remember:true issues a persistent cookie with Max-Age (got "${rawSetCookie}")`);

  // Regression check: the login query reuses the same $1 placeholder twice
  // ("username = $1 OR email = $1"), which is exactly the pattern that was
  // silently broken in the SQLite adapter before the query() fix above —
  // logging in with an email address would have failed here previously.
  res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "casey@example.com", password: "correcthorse3" }) });
  assert(res.status === 200, `logging in with email instead of username works (got ${res.status})`);

  server.close();
  try { fs.unlinkSync(process.env.SQLITE_PATH); } catch (e) { /* best-effort cleanup */ }

  console.log(failures === 0 ? "\nAll db.sqlite.test.js checks passed." : `\n${failures} check(s) FAILED.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error("TEST HARNESS THREW:", e);
  // Force-exit even if the HTTP server is still listening — otherwise a
  // failed assertion partway through leaves an open handle and the
  // process hangs indefinitely instead of reporting failure.
  if (server) server.close();
  try { fs.unlinkSync(process.env.SQLITE_PATH); } catch (e2) { /* best-effort cleanup */ }
  process.exitCode = 1;
  process.exit(1);
});
