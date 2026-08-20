const crypto = require("crypto");
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

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

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
    setSessionCookie(res, token, true);
    res.status(201).json({ id: user.id, username: user.username });
  } catch (e) {
    console.error("signup error", e);
    res.status(500).json({ error: "Failed to create account." });
  }
});

router.post("/login", async (req, res) => {
  const { username, password, remember } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password required." });

  try {
    const result = await query("SELECT id, username, password_hash FROM users WHERE username = $1 OR email = $1", [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials." });
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials." });
    const token = signToken(user.id);
    setSessionCookie(res, token, remember !== false);
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

// PATCH /api/auth/username { newUsername, password } — requires the current
// password as confirmation, same as changing an email/password anywhere
// else. Does not touch the session cookie; the JWT carries the user id, not
// the username, so nothing needs re-issuing.
router.patch("/username", requireAuth, async (req, res) => {
  const { newUsername, password } = req.body || {};
  if (!newUsername || !USERNAME_RE.test(newUsername)) {
    return res.status(400).json({ error: "Username must be 3-24 characters, letters/numbers/underscore only." });
  }
  if (!password) {
    return res.status(400).json({ error: "Enter your current password to confirm." });
  }

  try {
    const userRes = await query("SELECT id, username, password_hash FROM users WHERE id = $1", [req.userId]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Incorrect password." });

    if (newUsername === user.username) {
      return res.json({ id: user.id, username: user.username });
    }

    const existing = await query("SELECT id FROM users WHERE username = $1", [newUsername]);
    if (existing.rows.length) return res.status(409).json({ error: "That username is already taken." });

    await query("UPDATE users SET username = $1 WHERE id = $2", [newUsername, req.userId]);
    res.json({ id: user.id, username: newUsername });
  } catch (e) {
    console.error("change username error", e);
    res.status(500).json({ error: "Failed to change username." });
  }
});

// POST /api/auth/forgot-password { username } — username or email.
//
// This app has no outbound email service configured (see .env.example —
// there's no SMTP/email provider anywhere in this codebase), so a real
// "email you a reset link" flow isn't wired up to anything that could
// actually deliver it. Rather than silently no-op or fake success, this
// returns the reset link directly in the API response, the same
// transparent-about-what's-simulated approach as the Gold Circle paywall.
// In a real deployment with an email provider, swap the response body for
// an actual send-email call and stop returning `resetUrl`/`resetToken`.
router.post("/forgot-password", async (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: "Username or email is required." });

  try {
    const userRes = await query("SELECT id, username FROM users WHERE username = $1 OR email = $1", [username]);
    const user = userRes.rows[0];
    // Deliberately the same response whether or not the account exists —
    // otherwise this endpoint becomes a username/email enumeration oracle.
    if (!user) {
      return res.json({ ok: true, delivered: false });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await query(
      "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, hashToken(rawToken), expiresAt]
    );

    res.json({
      ok: true,
      delivered: false,
      demoNote: "No email service is configured for this app, so here is the reset token directly instead of sending it — it expires in 15 minutes.",
      resetToken: rawToken,
      username: user.username,
      expiresAt,
    });
  } catch (e) {
    console.error("forgot password error", e);
    res.status(500).json({ error: "Failed to start password reset." });
  }
});

// POST /api/auth/reset-password { token, newPassword }
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token) return res.status(400).json({ error: "Reset token is required." });
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  try {
    const tokenHash = hashToken(token);
    const rowRes = await query(
      "SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = $1",
      [tokenHash]
    );
    const row = rowRes.rows[0];
    if (!row) return res.status(400).json({ error: "Invalid or expired reset token." });
    if (row.used_at) return res.status(400).json({ error: "This reset token has already been used." });

    const expiresAt = row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at;
    if (new Date(expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: "This reset token has expired. Request a new one." });
    }

    const hash = await hashPassword(newPassword);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, row.user_id]);
    await query("UPDATE password_resets SET used_at = $1 WHERE id = $2", [new Date().toISOString(), row.id]);

    res.json({ ok: true });
  } catch (e) {
    console.error("reset password error", e);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

module.exports = router;
