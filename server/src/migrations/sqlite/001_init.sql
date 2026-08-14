-- Maison de Merde schema (v1) — SQLite dev-mode variant.
-- Mirrors src/migrations/postgres/001_init.sql column-for-column so the
-- application code (src/statsHelpers.js, routes/*) works unmodified against
-- either driver. Differences are purely dialect (INTEGER PRIMARY KEY
-- AUTOINCREMENT instead of SERIAL, TEXT instead of TIMESTAMPTZ/DATE/BOOLEAN,
-- since SQLite has no native versions of those types).

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  grace_tokens    INTEGER NOT NULL DEFAULT 1,
  last_grace_grant_streak INTEGER NOT NULL DEFAULT 0,
  streak_freeze_until TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occurred_at     TEXT NOT NULL,
  bristol_type    INTEGER,
  color           TEXT,
  odor            TEXT,
  pain            TEXT,
  visible_food    INTEGER NOT NULL DEFAULT 0,
  blood_flag      INTEGER NOT NULL DEFAULT 0,
  symptoms        TEXT NOT NULL DEFAULT '[]',
  notes           TEXT,
  ai_suggested    INTEGER NOT NULL DEFAULT 0,
  ai_confidence   REAL,
  photo_kept      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_log_user_time ON sessions_log (user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS badges_granted (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id        TEXT NOT NULL,
  unlocked_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS friendships (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, friend_id)
);
