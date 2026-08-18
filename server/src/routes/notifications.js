const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();
router.use(requireAuth);

function parseNotification(n) {
  let payload = {};
  try { payload = JSON.parse(n.payload || "{}"); } catch (e) { /* leave empty */ }
  return { id: n.id, type: n.type, payload, created_at: n.created_at, read: !!n.read_at };
}

// GET /api/notifications — most recent 30, newest first, plus an unread count.
router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, type, payload, created_at, read_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30",
      [req.userId]
    );
    const unreadRes = await query(
      "SELECT COUNT(*) AS c FROM notifications WHERE user_id = $1 AND read_at IS NULL",
      [req.userId]
    );
    res.json({
      notifications: result.rows.map(parseNotification),
      unreadCount: Number(unreadRes.rows[0].c) || 0,
    });
  } catch (e) {
    console.error("list notifications error", e);
    res.status(500).json({ error: "Failed to load notifications." });
  }
});

// POST /api/notifications/:id/read
router.post("/:id/read", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await query(
      "UPDATE notifications SET read_at = $1 WHERE id = $2 AND user_id = $3 AND read_at IS NULL",
      [new Date().toISOString(), id, req.userId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("mark notification read error", e);
    res.status(500).json({ error: "Failed to update notification." });
  }
});

// POST /api/notifications/read-all
router.post("/read-all", async (req, res) => {
  try {
    await query(
      "UPDATE notifications SET read_at = $1 WHERE user_id = $2 AND read_at IS NULL",
      [new Date().toISOString(), req.userId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("mark all notifications read error", e);
    res.status(500).json({ error: "Failed to update notifications." });
  }
});

module.exports = router;
