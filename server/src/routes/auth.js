const express = require("express");
const { query } = require("../db");
const {
  hashPassword,
  verifyPassword,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  validateSignupInput,
} = require("../auth");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body || {};
  const errors = validateSignupInput({ username, email, password });
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  try {
    const existing = await query("SELECT id FROM users WHERE username = $1 OR email = $2", [username, email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: "Username or email already in use." });
    }
    const hash = await hashPassword(password);
    const result = await query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username",
      [username, email, hash]
    );
    const user = result.rows[0];
    const token = signToken(user.id);
    setSessionCookie(res, token);
    res.status(201).json({ id: user.id, username: user.username });
  } catch (e) {
    console.error("signup error", e);
    res.status(500).json({ error: "Failed to create account." });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password required." });

  try {
    const result = await query("SELECT id, username, password_hash FROM users WHERE username = $1 OR email = $1", [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials." });
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials." });
    const token = signToken(user.id);
    setSessionCookie(res, token);
    res.json({ id: user.id, username: user.username });
  } catch (e) {
    console.error("login error", e);
    res.status(500).json({ error: "Failed to log in." });
  }
});

router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const result = await query("SELECT id, username, email FROM users WHERE id = $1", [req.userId]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json(user);
});

module.exports = router;
