const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const COOKIE_NAME = "maison_de_merde_session";
const JWT_EXPIRY = "30d";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET env var is not set. Refusing to sign tokens with a default secret.");
  }
  return secret;
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

// remember=true (the default) sets a 30-day persistent cookie — the JWT
// itself is always signed with a 30-day expiry either way, but a
// non-persistent cookie is discarded by the browser when it's closed,
// giving "remember me" an actual effect instead of always being on.
function setSessionCookie(res, token, remember = true) {
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  if (remember) opts.maxAge = 30 * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE_NAME, token, opts);
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

/** Express middleware: attaches req.userId if a valid session cookie is present. */
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated." });
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

// Basic validation — not exhaustive, but blocks the obviously-bad cases
// (empty strings, malformed emails, trivially short passwords).
function validateSignupInput({ username, email, password }) {
  const errors = [];
  if (!username || username.length < 3 || username.length > 24 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username must be 3-24 characters, letters/numbers/underscore only.");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("A valid email is required.");
  }
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }
  return errors;
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  validateSignupInput,
};
