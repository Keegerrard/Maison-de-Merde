const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");
const { notify } = require("../notifications");

const router = express.Router();
router.use(requireAuth);

async function requireFriend(myId, username) {
  const targetRes = await query("SELECT id, username FROM users WHERE username = $1", [username]);
  const target = targetRes.rows[0];
  if (!target) return { error: 404, message: "No user with that username." };
  if (target.id === myId) return { error: 400, message: "You can't chat with yourself." };
  const friendCheck = await query(
    "SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = 'accepted'",
    [myId, target.id]
  );
  if (!friendCheck.rows.length) return { error: 400, message: `${username} isn't in your Circle yet.` };
  return { target };
}

// GET /api/chat/:username — last 50 messages between me and this friend,
// oldest first. Also marks their messages to me as read.
router.get("/:username", async (req, res) => {
  try {
    const { target, error, message } = await requireFriend(req.userId, req.params.username);
    if (error) return res.status(error).json({ error: message });

    const result = await query(
      `SELECT id, sender_id, recipient_id, body, created_at FROM messages
       WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at DESC LIMIT 50`,
      [req.userId, target.id]
    );

    await query(
      "UPDATE messages SET read_at = $1 WHERE sender_id = $2 AND recipient_id = $3 AND read_at IS NULL",
      [new Date().toISOString(), target.id, req.userId]
    );

    res.json({
      username: target.username,
      messages: result.rows.reverse().map((m) => ({ ...m, isMine: m.sender_id === req.userId })),
    });
  } catch (e) {
    console.error("get chat error", e);
    res.status(500).json({ error: "Failed to load chat." });
  }
});

// POST /api/chat/:username { body }
router.post("/:username", async (req, res) => {
  const body = (req.body?.body || "").trim().slice(0, 2000);
  if (!body) return res.status(400).json({ error: "Message body is required." });

  try {
    const { target, error, message } = await requireFriend(req.userId, req.params.username);
    if (error) return res.status(error).json({ error: message });

    const insertRes = await query(
      "INSERT INTO messages (sender_id, recipient_id, body) VALUES ($1, $2, $3) RETURNING id, created_at",
      [req.userId, target.id, body]
    );

    const meRes = await query("SELECT username FROM users WHERE id = $1", [req.userId]);
    await notify(target.id, "message", { username: meRes.rows[0].username, preview: body.slice(0, 80) });

    res.status(201).json({ id: insertRes.rows[0].id, created_at: insertRes.rows[0].created_at });
  } catch (e) {
    console.error("send chat error", e);
    res.status(500).json({ error: "Failed to send message." });
  }
});

module.exports = router;
