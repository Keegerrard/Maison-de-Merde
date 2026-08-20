/* =========================================================================
   Integration test: real Express app + real route/auth/db code, but the
   'pg' module is swapped for pg-mem's in-memory Postgres-compatible
   adapter (no real Postgres server, no Docker, no root needed).

   This exercises: migrations, signup/login cookie auth, session logging,
   streak/achievement side effects, and the friend/circle flow — the parts
   most likely to break silently (SQL typos, wrong param order, auth
   middleware wiring) that a pure-function unit test can't catch.
   ========================================================================= */

process.env.JWT_SECRET = "test-secret-do-not-use-in-prod";
process.env.DATABASE_URL = "postgres://mem/mem"; // ignored by pg-mem, just needs to be present
process.env.NODE_ENV = "test";

// --- Mock 'pg' with pg-mem before anything requires it ---
const { newDb } = require("pg-mem");
const mem = newDb({ autoCreateForeignKeyIndices: true });
mem.public.registerFunction({ name: "now", returns: "timestamptz", implementation: () => new Date() });
const pgMemAdapter = mem.adapters.createPg();

const Module = require("module");
const pgPath = require.resolve("pg");
require.cache[pgPath] = { id: pgPath, filename: pgPath, loaded: true, exports: pgMemAdapter };

const path = require("path");
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");

const { runMigrations } = require("../src/migrate");
require("../src/db"); // must load after the 'pg' mock above, before route files
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
  if (!setCookie) return null;
  return setCookie.split(";")[0];
}

let server = null;

async function main() {
  await runMigrations();
  console.log("[test] migrations applied against pg-mem\n");

  const app = makeApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;

  // --- Signup user 1 ---
  let res = await fetch(`${base}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "marcus", email: "marcus@example.com", password: "correcthorse1" }),
  });
  assert(res.status === 201, "signup returns 201");
  const cookie1 = extractCookie(res);
  assert(!!cookie1, "signup sets a session cookie");

  // --- Reject weak signup ---
  res = await fetch(`${base}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "x", email: "not-an-email", password: "short" }),
  });
  assert(res.status === 400, "signup validation rejects bad input (400)");

  // --- Duplicate signup rejected ---
  res = await fetch(`${base}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "marcus", email: "marcus2@example.com", password: "correcthorse1" }),
  });
  assert(res.status === 409, "duplicate username rejected (409)");

  // --- /me requires auth ---
  res = await fetch(`${base}/auth/me`);
  assert(res.status === 401, "GET /me without cookie returns 401");

  res = await fetch(`${base}/auth/me`, { headers: { Cookie: cookie1 } });
  assert(res.status === 200, "GET /me with cookie returns 200");
  const me = await res.json();
  assert(me.username === "marcus", "GET /me returns the right user");

  // --- Wrong password rejected ---
  res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "marcus", password: "wrongpassword" }),
  });
  assert(res.status === 401, "login with wrong password returns 401");

  // --- Quick log a session ---
  res = await fetch(`${base}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({}),
  });
  assert(res.status === 201, "quick log session returns 201");
  let body = await res.json();
  assert(body.streak.current === 1, `streak.current is 1 after first log (got ${body.streak.current})`);
  assert(body.newlyUnlocked.some((b) => b.id === "milestone_first"), "first-log badge unlocked on first session");

  // --- Detailed log with bad bristol type rejected ---
  res = await fetch(`${base}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ bristolType: 9 }),
  });
  assert(res.status === 400, "invalid bristolType (9) rejected with 400");

  // --- Detailed log, valid ---
  res = await fetch(`${base}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ bristolType: 4, color: "brown", odor: "typical", pain: "none" }),
  });
  assert(res.status === 201, "detailed log returns 201");

  // --- Dashboard reflects 2 sessions ---
  res = await fetch(`${base}/dashboard`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(body.totalSessions === 2, `dashboard totalSessions is 2 (got ${body.totalSessions})`);
  assert(body.bristolCounts[3] === 1, "bristolCounts[3] (Type 4) incremented");
  assert(Array.isArray(body.heatmap) && body.heatmap.length === 91, `dashboard returns a 91-day heatmap array (got length ${body.heatmap && body.heatmap.length})`);

  // --- Vision endpoint without OPENAI_API_KEY returns 503, not a crash ---
  delete process.env.OPENAI_API_KEY;
  const FormDataImpl = globalThis.FormData;
  const fd = new FormDataImpl();
  fd.append("photo", new Blob([Buffer.from([1, 2, 3])], { type: "image/png" }), "test.png");
  res = await fetch(`${base}/vision/analyze`, { method: "POST", headers: { Cookie: cookie1 }, body: fd });
  assert(res.status === 503, `vision analyze without API key returns 503 (got ${res.status})`);

  // --- Second user + friend flow ---
  res = await fetch(`${base}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "priya", email: "priya@example.com", password: "correcthorse2" }),
  });
  const cookie2 = extractCookie(res);
  await fetch(`${base}/sessions`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie2 }, body: JSON.stringify({}) });

  res = await fetch(`${base}/circle/friends`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ username: "priya" }),
  });
  assert(res.status === 201, "friend request created (201)");

  res = await fetch(`${base}/circle/requests`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(body.requests.length === 1 && body.requests[0].username === "marcus", "priya sees pending request from marcus");

  const requesterId = body.requests[0].id;
  res = await fetch(`${base}/circle/requests/${requesterId}/accept`, { method: "POST", headers: { Cookie: cookie2 } });
  assert(res.status === 200, "accept friend request returns 200");

  res = await fetch(`${base}/circle`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(body.leaderboard.length === 2, `marcus's circle shows 2 people (got ${body.leaderboard.length})`);
  assert(body.leaderboard.some((r) => r.username === "priya"), "priya appears in marcus's leaderboard after mutual accept");

  // --- Nonexistent friend rejected ---
  res = await fetch(`${base}/circle/friends`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ username: "nobody_here" }),
  });
  assert(res.status === 404, "adding a nonexistent username returns 404");

  // --- Session detail + sharing ---
  res = await fetch(`${base}/sessions?limit=1`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  const sessionId = body.sessions[0].id;

  res = await fetch(`${base}/sessions/${sessionId}`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(res.status === 200 && body.isOwner === true, "owner can view full session detail");

  res = await fetch(`${base}/sessions/${sessionId}`, { headers: { Cookie: cookie2 } });
  assert(res.status === 403, `non-owner without a share is forbidden (got ${res.status})`);

  res = await fetch(`${base}/sessions/${sessionId}/share`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie1 }, body: JSON.stringify({ username: "priya" }) });
  assert(res.status === 201, `sharing with a friend succeeds (got ${res.status})`);

  res = await fetch(`${base}/sessions/${sessionId}`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(res.status === 200 && body.isOwner === false, "recipient can view the shared session, not flagged as owner");

  res = await fetch(`${base}/sessions/shared`, { headers: { Cookie: cookie2 } });
  body = await res.json();
  assert(body.sessions.length === 1 && body.sessions[0].shared_by_username === "marcus", "shared-with-me list shows the sharer's username");

  // --- Chat (friends-only), including the same repeated-$1-placeholder
  // pattern that broke in the SQLite adapter — pg-mem uses real Postgres
  // param binding so this was never at risk there, but keeping the same
  // scenario covered in both suites documents that fact rather than
  // assuming it.
  res = await fetch(`${base}/chat/marcus`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie2 }, body: JSON.stringify({ body: "hey marcus" }) });
  assert(res.status === 201, `priya can message her friend marcus (got ${res.status})`);

  res = await fetch(`${base}/chat/priya`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(body.messages.length === 1 && body.messages[0].isMine === false, "marcus sees priya's message, correctly flagged as not his own");

  // --- Notifications ---
  res = await fetch(`${base}/notifications`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  const marcusTypes = body.notifications.map((n) => n.type);
  assert(marcusTypes.includes("friend_accept") && marcusTypes.includes("message"), `marcus has friend_accept + message notifications (got ${JSON.stringify(marcusTypes)})`);

  res = await fetch(`${base}/notifications/read-all`, { method: "POST", headers: { Cookie: cookie1 } });
  assert(res.status === 200, "mark-all-read succeeds");
  res = await fetch(`${base}/notifications`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(body.unreadCount === 0, `unread count is 0 after mark-all-read (got ${body.unreadCount})`);

  // --- Profile: own read/write, trait validation, privacy gating ---
  res = await fetch(`${base}/profile`, { headers: { Cookie: cookie1 } });
  body = await res.json();
  assert(res.status === 200 && body.isPublic === false, "profile is private by default");

  res = await fetch(`${base}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ traitBadgeId: "streak_365" }),
  });
  assert(res.status === 400, "can't set a trait for an unearned badge");

  res = await fetch(`${base}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ nickname: "M", banner: "claret", traitBadgeId: "milestone_first", isPublic: true }),
  });
  body = await res.json();
  assert(res.status === 200 && body.banner === "claret", "profile update round-trips");

  res = await fetch(`${base}/profile/marcus`, { headers: { Cookie: cookie2 } });
  assert(res.status === 200, "a public profile is visible to anyone");

  // --- Change username ---
  res = await fetch(`${base}/auth/username`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({ newUsername: "marcus2", password: "correcthorse1" }),
  });
  body = await res.json();
  assert(res.status === 200 && body.username === "marcus2", `username change succeeds (got ${JSON.stringify(body)})`);

  res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "marcus2", password: "correcthorse1" }) });
  assert(res.status === 200, "can log back in with the new username");

  // --- Forgot / reset password ---
  res = await fetch(`${base}/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "marcus2" }) });
  body = await res.json();
  assert(res.status === 200 && typeof body.resetToken === "string", `forgot-password returns a reset token (got ${JSON.stringify(body)})`);

  res = await fetch(`${base}/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: body.resetToken, newPassword: "newpassword1" }) });
  assert(res.status === 200, "resetting with a valid token succeeds");

  res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "marcus2", password: "newpassword1" }) });
  assert(res.status === 200, "logging in with the new password works");

  // --- Remember me --- (marcus was renamed to marcus2 and had their
  // password reset to newpassword1 by the two blocks just above)
  res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "marcus2", password: "newpassword1", remember: false }) });
  let rawSetCookie = res.headers.get("set-cookie") || "";
  assert(res.status === 200 && !/Max-Age/i.test(rawSetCookie), `remember:false issues a session-only cookie (got "${rawSetCookie}")`);

  res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "marcus@example.com", password: "newpassword1" }) });
  assert(res.status === 200, `logging in with email instead of username still works after the username change (got ${res.status})`);

  server.close();
  console.log(failures === 0 ? "\nAll db.test.js checks passed." : `\n${failures} check(s) FAILED.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error("TEST HARNESS THREW:", e);
  if (server) server.close();
  process.exitCode = 1;
  process.exit(1);
});
