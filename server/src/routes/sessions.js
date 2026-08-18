const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");
const { recomputeAfterNewSession } = require("../statsHelpers");
const { notify } = require("../notifications");

const router = express.Router();
router.use(requireAuth);

const VALID_COLORS = ["brown", "dark-brown", "green", "yellow", "pale", "black", "red"];
const VALID_ODORS = ["typical", "mild", "strong", "severe"];
const VALID_PAIN = ["none", "mild", "moderate", "severe"];
const VALID_SYMPTOMS = ["bloating", "urgency", "incomplete", "cramping"];

// POST /api/sessions — quick log (empty body) or detailed log.
router.post("/", async (req, res) => {
  const b = req.body || {};

  const bristolType = b.bristolType != null ? Number(b.bristolType) : null;
  if (bristolType !== null && (!Number.isInteger(bristolType) || bristolType < 1 || bristolType > 7)) {
    return res.status(400).json({ error: "bristolType must be an integer 1-7." });
  }
  if (b.color && !VALID_COLORS.includes(b.color)) {
    return res.status(400).json({ error: "Invalid color value." });
  }
  if (b.odor && !VALID_ODORS.includes(b.odor)) {
    return res.status(400).json({ error: "Invalid odor value." });
  }
  if (b.pain && !VALID_PAIN.includes(b.pain)) {
    return res.status(400).json({ error: "Invalid pain value." });
  }
  // Whitelisted, same rigor as color/odor/pain — the client only ever sends
  // these four chip values, and this also means notes/symptoms displayed
  // elsewhere (e.g. a shared session's detail view) can't carry arbitrary
  // strings from this field.
  const symptoms = Array.isArray(b.symptoms) ? [...new Set(b.symptoms.filter((s) => VALID_SYMPTOMS.includes(s)))] : [];

  try {
    const insertRes = await query(
      `INSERT INTO sessions_log
        (user_id, occurred_at, bristol_type, color, odor, pain, visible_food, blood_flag, symptoms, notes, ai_suggested, ai_confidence, photo_kept)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, occurred_at`,
      [
        req.userId,
        new Date().toISOString(),
        bristolType,
        b.color || null,
        b.odor || null,
        b.pain || null,
        !!b.visibleFood,
        !!b.bloodFlag,
        JSON.stringify(symptoms),
        (b.notes || "").slice(0, 2000) || null,
        !!b.aiSuggested,
        typeof b.aiConfidence === "number" ? b.aiConfidence : null,
        b.keepPhoto && b.photoDataUrl ? String(b.photoDataUrl).slice(0, 5_000_000) : null,
      ]
    );

    const stats = await recomputeAfterNewSession(req.userId);

    res.status(201).json({
      session: insertRes.rows[0],
      streak: stats.streak,
      graceTokens: stats.graceTokens,
      graceGranted: stats.graceGranted,
      newlyUnlocked: stats.newlyUnlocked.map((b) => ({ id: b.id, icon: b.icon, name: b.name, desc: b.desc })),
    });
  } catch (e) {
    console.error("create session error", e);
    res.status(500).json({ error: "Failed to save session." });
  }
});

// GET /api/sessions?limit=15 — recent sessions for the current user.
router.get("/", async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  try {
    const result = await query(
      `SELECT id, occurred_at, bristol_type, color, odor, pain, visible_food, blood_flag, symptoms, notes
       FROM sessions_log WHERE user_id = $1 ORDER BY occurred_at DESC LIMIT $2`,
      [req.userId, limit]
    );
    const sessions = result.rows.map((s) => ({
      ...s,
      symptoms: (() => { try { return JSON.parse(s.symptoms || "[]"); } catch (e) { return []; } })(),
    }));
    res.json({ sessions });
  } catch (e) {
    console.error("list sessions error", e);
    res.status(500).json({ error: "Failed to load sessions." });
  }
});

function parseSessionRow(s) {
  return {
    ...s,
    symptoms: (() => { try { return JSON.parse(s.symptoms || "[]"); } catch (e) { return []; } })(),
    visibleFood: !!s.visible_food,
    bloodFlag: !!s.blood_flag,
    aiSuggested: !!s.ai_suggested,
  };
}

// GET /api/sessions/shared — sessions friends have explicitly shared with me.
// Must be registered before GET /:id so "shared" isn't swallowed as an id.
router.get("/shared", async (req, res) => {
  try {
    const result = await query(
      `SELECT s.id, s.occurred_at, s.bristol_type, s.color, s.odor, s.pain, s.visible_food, s.blood_flag,
              s.symptoms, s.notes, s.ai_suggested, s.ai_confidence, s.photo_kept,
              u.username AS shared_by_username, sh.created_at AS shared_at
       FROM shared_sessions sh
       JOIN sessions_log s ON s.id = sh.session_id
       JOIN users u ON u.id = sh.shared_by
       WHERE sh.shared_with = $1
       ORDER BY sh.created_at DESC
       LIMIT 50`,
      [req.userId]
    );
    res.json({ sessions: result.rows.map(parseSessionRow) });
  } catch (e) {
    console.error("shared sessions error", e);
    res.status(500).json({ error: "Failed to load shared sessions." });
  }
});

// GET /api/sessions/:id — full detail. Visible to the owner, or to anyone
// it's been explicitly shared with (see shared_sessions).
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid session id." });

  try {
    const result = await query(
      `SELECT id, user_id, occurred_at, bristol_type, color, odor, pain, visible_food, blood_flag,
              symptoms, notes, ai_suggested, ai_confidence, photo_kept
       FROM sessions_log WHERE id = $1`,
      [id]
    );
    const session = result.rows[0];
    if (!session) return res.status(404).json({ error: "Session not found." });

    if (session.user_id !== req.userId) {
      const shareCheck = await query(
        "SELECT id FROM shared_sessions WHERE session_id = $1 AND shared_with = $2",
        [id, req.userId]
      );
      if (!shareCheck.rows.length) return res.status(403).json({ error: "This session hasn't been shared with you." });
    }

    res.json({ session: parseSessionRow(session), isOwner: session.user_id === req.userId });
  } catch (e) {
    console.error("get session error", e);
    res.status(500).json({ error: "Failed to load session." });
  }
});

// POST /api/sessions/:id/share { username } — share a session with a
// confirmed friend. Explicit and per-session, not a Circle-wide default.
router.post("/:id/share", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const username = (req.body?.username || "").trim();
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid session id." });
  if (!username) return res.status(400).json({ error: "username is required." });

  try {
    const sessionRes = await query("SELECT id, user_id FROM sessions_log WHERE id = $1", [id]);
    const session = sessionRes.rows[0];
    if (!session) return res.status(404).json({ error: "Session not found." });
    if (session.user_id !== req.userId) return res.status(403).json({ error: "You can only share your own sessions." });

    const targetRes = await query("SELECT id, username FROM users WHERE username = $1", [username]);
    const target = targetRes.rows[0];
    if (!target) return res.status(404).json({ error: "No user with that username." });
    if (target.id === req.userId) return res.status(400).json({ error: "You can't share with yourself." });

    const friendCheck = await query(
      "SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = 'accepted'",
      [req.userId, target.id]
    );
    if (!friendCheck.rows.length) return res.status(400).json({ error: `${username} isn't in your Circle yet.` });

    await query(
      `INSERT INTO shared_sessions (session_id, shared_by, shared_with) VALUES ($1, $2, $3)
       ON CONFLICT (session_id, shared_with) DO NOTHING`,
      [id, req.userId, target.id]
    );

    const meRes = await query("SELECT username FROM users WHERE id = $1", [req.userId]);
    await notify(target.id, "session_shared", { username: meRes.rows[0].username, sessionId: id });

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error("share session error", e);
    res.status(500).json({ error: "Failed to share session." });
  }
});

module.exports = router;
