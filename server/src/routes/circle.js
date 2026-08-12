const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");
const { calcStreak, daysBetween, todayISO, toISODateString } = require("../streak");

const router = express.Router();
router.use(requireAuth);

async function computeUserRow(userId, username) {
  const userRes = await query(
    "SELECT grace_tokens, streak_freeze_until FROM users WHERE id = $1",
    [userId]
  );
  const user = userRes.rows[0];
  const sessRes = await query("SELECT occurred_at FROM sessions_log WHERE user_id = $1 ORDER BY occurred_at ASC", [userId]);
  const timestamps = sessRes.rows.map((r) => r.occurred_at.toISOString());
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

// POST /api/circle/friends { username } — send a friend request.
router.post("/friends", async (req, res) => {
  const username = (req.body?.username || "").trim();
  if (!username) return res.status(400).json({ error: "username is required." });

  try {
    const targetRes = await query("SELECT id FROM users WHERE username = $1", [username]);
    const target = targetRes.rows[0];
    if (!target) return res.status(404).json({ error: "No user with that username." });
    if (target.id === req.userId) return res.status(400).json({ error: "You can't friend yourself." });

    await query(
      `INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')
       ON CONFLICT (user_id, friend_id) DO NOTHING`,
      [req.userId, target.id]
    );

    // If the other direction already requested us, auto-accept both ways.
    const reciprocal = await query("SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2", [target.id, req.userId]);
    if (reciprocal.rows.length) {
      await query("UPDATE friendships SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2", [target.id, req.userId]);
      await query("UPDATE friendships SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2", [req.userId, target.id]);
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
    res.json({ ok: true });
  } catch (e) {
    console.error("accept request error", e);
    res.status(500).json({ error: "Failed to accept request." });
  }
});

module.exports = router;
