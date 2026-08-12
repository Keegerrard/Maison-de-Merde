const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");
const { recomputeAfterNewSession } = require("../statsHelpers");

const router = express.Router();
router.use(requireAuth);

const VALID_COLORS = ["brown", "dark-brown", "green", "yellow", "pale", "black", "red"];
const VALID_ODORS = ["typical", "mild", "strong", "severe"];
const VALID_PAIN = ["none", "mild", "moderate", "severe"];

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
  const symptoms = Array.isArray(b.symptoms) ? b.symptoms.filter((s) => typeof s === "string").slice(0, 10) : [];

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

module.exports = router;
