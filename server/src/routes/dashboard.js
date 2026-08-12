const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");
const { loadUserStats } = require("../statsHelpers");
const { calcStreak, BADGES, todayISO, toISODateString } = require("../streak");

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard — streak, chart data, badge unlock state.
router.get("/", async (req, res) => {
  try {
    const { user, sessions, unlockedIds } = await loadUserStats(req.userId);
    const timestamps = sessions.map((s) => s.occurred_at.toISOString());
    const freezeUntil = toISODateString(user.streak_freeze_until);
    const streak = calcStreak(timestamps, user.grace_tokens, freezeUntil);

    // Frequency for the last 30 days.
    const dayBuckets = {};
    for (let i = 29; i >= 0; i--) {
      dayBuckets[todayISO(new Date(Date.now() - i * 86400000))] = 0;
    }
    timestamps.forEach((t) => {
      const day = t.slice(0, 10);
      if (day in dayBuckets) dayBuckets[day] += 1;
    });
    const frequency30d = Object.entries(dayBuckets).map(([day, count]) => ({ day, count }));

    // Bristol type distribution.
    const bristolCounts = new Array(7).fill(0);
    sessions.forEach((s) => {
      if (s.bristol_type) bristolCounts[s.bristol_type - 1] += 1;
    });

    const badges = BADGES.map((b) => ({
      id: b.id,
      icon: b.icon,
      name: b.name,
      desc: b.desc,
      unlocked: unlockedIds.has(b.id),
    }));

    res.json({
      streak,
      graceTokens: user.grace_tokens,
      streakFreezeUntil: freezeUntil,
      frequency30d,
      bristolCounts,
      badges,
      totalSessions: sessions.length,
    });
  } catch (e) {
    console.error("dashboard error", e);
    res.status(500).json({ error: "Failed to load dashboard." });
  }
});

// POST /api/dashboard/freeze { days }
router.post("/freeze", async (req, res) => {
  const days = parseInt(req.body?.days, 10);
  if (!days || days <= 0 || days > 60) return res.status(400).json({ error: "days must be between 1 and 60." });
  const until = todayISO(new Date(Date.now() + days * 86400000));
  try {
    await query("UPDATE users SET streak_freeze_until = $1 WHERE id = $2", [until, req.userId]);
    res.json({ streakFreezeUntil: until });
  } catch (e) {
    console.error("freeze error", e);
    res.status(500).json({ error: "Failed to freeze streak." });
  }
});

// GET /api/dashboard/export — plain-text doctor summary.
router.get("/export", async (req, res) => {
  try {
    const { user, sessions } = await loadUserStats(req.userId);
    const timestamps = sessions.map((s) => s.occurred_at.toISOString());
    const streak = calcStreak(timestamps, user.grace_tokens, toISODateString(user.streak_freeze_until));

    const bristolCounts = new Array(7).fill(0);
    const flagged = [];
    const fullRows = await query(
      "SELECT occurred_at, bristol_type, pain, blood_flag FROM sessions_log WHERE user_id = $1 ORDER BY occurred_at ASC",
      [req.userId]
    );
    fullRows.rows.forEach((s) => {
      if (s.bristol_type) bristolCounts[s.bristol_type - 1] += 1;
      if (s.blood_flag || s.pain === "severe") flagged.push(s);
    });

    let out = `PROSHITUTE — SESSION SUMMARY (de-identified)\n`;
    out += `Generated: ${new Date().toLocaleString()}\n`;
    out += `================================================\n\n`;
    out += `Total sessions logged: ${sessions.length}\n`;
    out += `Current streak: ${streak.current} days | Longest streak: ${streak.longest} days\n\n`;
    out += `Bristol Type Distribution:\n`;
    bristolCounts.forEach((c, i) => { out += `  Type ${i + 1}: ${c}\n`; });
    out += `\nFlagged sessions (severe pain or blood reported): ${flagged.length}\n`;
    flagged.forEach((s) => {
      out += `  - ${new Date(s.occurred_at).toLocaleDateString()}: pain=${s.pain}, blood=${!!s.blood_flag}\n`;
    });
    out += `\nNote: this is a self-reported wellness summary, not a diagnosis. Share with a healthcare provider as context, not a conclusion.\n`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="proshitute-summary-${todayISO()}.txt"`);
    res.send(out);
  } catch (e) {
    console.error("export error", e);
    res.status(500).json({ error: "Failed to export summary." });
  }
});

module.exports = router;
