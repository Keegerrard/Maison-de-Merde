const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");
const { calcStreak, daysBetween, todayISO, toISODateString, toISOStringSafe } = require("../streak");
const { notify } = require("../notifications");
const { rateLimit } = require("../rateLimit");

const router = express.Router();
router.use(requireAuth);

async function computeUserRow(userId, username) {
  const userRes = await query(
    "SELECT grace_tokens, streak_freeze_until FROM users WHERE id = $1",
    [userId]
  );
  const user = userRes.rows[0];
  const sessRes = await query("SELECT occurred_at FROM sessions_log WHERE user_id = $1 ORDER BY occurred_at ASC", [userId]);
  const timestamps = sessRes.rows.map((r) => toISOStringSafe(r.occurred_at));
  const streak = calcStreak(timestamps, user.grace_tokens, toISODateString(user.streak_freeze_until));

  const uniqueDays = new Set(timestamps.map((t) => t.slice(0, 10))).size;
  const totalDaysTracked = timestamps.length
    ? Math.max(1, daysBetween(timestamps[0].slice(0, 10), todayISO()) + 1)
    : 1;
  const consistency = Math.min(1, uniqueDays / totalDaysTracked);

  return { username, streak: streak.current, longest: streak.longest, consistency };
}

// GET /api/circle — me + accepted friends, ranked by streak then consistency.
router.get("/", async (req, res) => {
  try {
    const meRes = await query("SELECT username FROM users WHERE id = $1", [req.userId]);
    const me = await computeUserRow(req.userId, meRes.rows[0].username);
    me.isMe = true;
    me.userId = req.userId;

    const friendsRes = await query(
      `SELECT u.id, u.username FROM friendships f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 AND f.status = 'accepted'`,
      [req.userId]
    );

    const friendRows = await Promise.all(
      friendsRes.rows.map(async (f) => {
        const row = await computeUserRow(f.id, f.username);
        row.isMe = false;
        row.userId = f.id;
        return row;
      })
    );

    const rows = [me, ...friendRows].sort((a, b) => (b.streak - a.streak) || (b.consistency - a.consistency));
    res.json({ leaderboard: rows });
  } catch (e) {
    console.error("circle error", e);
    res.status(500).json({ error: "Failed to load circle." });
  }
});

// GET /api/circle/global — a public, opt-in leaderboard: you, plus every
// user who has switched their profile to Public (the same toggle in Profile
// settings that already gates GET /api/profile/:username). Nobody appears
// here without having chosen to. Filtered in JS rather than in SQL because
// is_public is a real BOOLEAN in Postgres but an INTEGER 0/1 in the SQLite
// dev driver, and this codebase's convention elsewhere (sessions.js,
// dashboard.js) is always to fetch booleans as-is and truthiness-check them
// in JS rather than write a `= true`/`= 1` WHERE clause that only works
// against one driver.
router.get("/global", async (req, res) => {
  try {
    const meRes = await query("SELECT username FROM users WHERE id = $1", [req.userId]);
    const me = await computeUserRow(req.userId, meRes.rows[0].username);
    me.isMe = true;
    me.userId = req.userId;

    const candidatesRes = await query(
      `SELECT u.id, u.username, p.is_public FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.id != $1`,
      [req.userId]
    );
    const publicCandidates = candidatesRes.rows.filter((r) => !!r.is_public);

    const publicRows = await Promise.all(
      publicCandidates.map(async (u) => {
        const row = await computeUserRow(u.id, u.username);
        row.isMe = false;
        row.userId = u.id;
        return row;
      })
    );

    const rows = [me, ...publicRows].sort(
      (a, b) => b.streak - a.streak || b.consistency - a.consistency
    );
    res.json({ leaderboard: rows });
  } catch (e) {
    console.error("global leaderboard error", e);
    res.status(500).json({ error: "Failed to load the global leaderboard." });
  }
});

// POST /api/circle/friends { username } — send a friend request.
//
// Idempotent and notification-safe: re-POSTing the same username (the
// client's own retry-on-error, a double-click, or just someone mashing the
// button) must not re-notify the target every time. Previously this always
// called notify() unconditionally on every request, regardless of whether
// the friendship row was new — so hitting this endpoint repeatedly against
// someone you're already friends with (or already have a pending request
// to) would spam them with "wants to join your circle" / "accepted your
// circle request" notifications indefinitely. Fixed by checking the
// existing state first and only notifying on an actual transition.
router.post("/friends", rateLimit({ windowMs: 60 * 1000, max: 20, keyPrefix: "circle:friend-request", message: "Too many requests. Slow down." }), async (req, res) => {
  const username = (req.body?.username || "").trim();
  if (!username) return res.status(400).json({ error: "username is required." });

  try {
    const targetRes = await query("SELECT id FROM users WHERE username = $1", [username]);
    const target = targetRes.rows[0];
    if (!target) return res.status(404).json({ error: "No user with that username." });
    if (target.id === req.userId) return res.status(400).json({ error: "You can't friend yourself." });

    const existingRes = await query(
      "SELECT status FROM friendships WHERE user_id = $1 AND friend_id = $2",
      [req.userId, target.id]
    );
    const alreadyExisted = existingRes.rows.length > 0;

    if (!alreadyExisted) {
      await query(
        `INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')
         ON CONFLICT (user_id, friend_id) DO NOTHING`,
        [req.userId, target.id]
      );
    }

    // Nothing changed — this exact request (or friendship) already existed,
    // so there's nothing new to tell the target about.
    if (alreadyExisted) {
      return res.status(200).json({ ok: true });
    }

    // If the other direction already requested us, auto-accept both ways.
    const reciprocal = await query("SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2", [target.id, req.userId]);
    if (reciprocal.rows.length) {
      await query("UPDATE friendships SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2", [target.id, req.userId]);
      await query("UPDATE friendships SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2", [req.userId, target.id]);
      const meRes = await query("SELECT username FROM users WHERE id = $1", [req.userId]);
      await notify(target.id, "friend_accept", { username: meRes.rows[0].username });
    } else {
      const meRes = await query("SELECT username FROM users WHERE id = $1", [req.userId]);
      await notify(target.id, "friend_request", { username: meRes.rows[0].username });
    }

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error("add friend error", e);
    res.status(500).json({ error: "Failed to add friend." });
  }
});

// GET /api/circle/requests — pending incoming friend requests.
router.get("/requests", async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username FROM friendships f
       JOIN users u ON u.id = f.user_id
       WHERE f.friend_id = $1 AND f.status = 'pending'`,
      [req.userId]
    );
    res.json({ requests: result.rows });
  } catch (e) {
    console.error("requests error", e);
    res.status(500).json({ error: "Failed to load requests." });
  }
});

// POST /api/circle/requests/:userId/accept
router.post("/requests/:userId/accept", async (req, res) => {
  const requesterId = parseInt(req.params.userId, 10);
  try {
    await query("UPDATE friendships SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2", [requesterId, req.userId]);
    await query(
      `INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'accepted')
       ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`,
      [req.userId, requesterId]
    );
    const meRes = await query("SELECT username FROM users WHERE id = $1", [req.userId]);
    await notify(requesterId, "friend_accept", { username: meRes.rows[0].username });
    res.json({ ok: true });
  } catch (e) {
    console.error("accept request error", e);
    res.status(500).json({ error: "Failed to accept request." });
  }
});

module.exports = router;
