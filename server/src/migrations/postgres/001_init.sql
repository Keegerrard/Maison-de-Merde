-- Proshitute schema (v1). Idempotent: safe to run on every boot.

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  grace_tokens    INTEGER NOT NULL DEFAULT 1,
  last_grace_grant_streak INTEGER NOT NULL DEFAULT 0,
  streak_freeze_until DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions_log (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Always supplied explicitly by the app (new Date().toISOString()) rather
  -- than relying on a DB-side default, so behavior is identical whether
  -- this row was written via Postgres or the SQLite dev fallback.
  occurred_at     TIMESTAMPTZ NOT NULL,
  bristol_type    SMALLINT,
  color           TEXT,
  odor            TEXT,
  pain            TEXT,
  visible_food    BOOLEAN NOT NULL DEFAULT false,
  blood_flag      BOOLEAN NOT NULL DEFAULT false,
  -- JSON-encoded array (not a native TEXT[]) so the same column type and
  -- app-level (de)serialization work identically on SQLite, which has no
  -- array type. We never query into individual symptoms, so nothing is lost.
  symptoms        TEXT NOT NULL DEFAULT '[]',
  notes           TEXT,
  ai_suggested    BOOLEAN NOT NULL DEFAULT false,
  ai_confidence   REAL,
  photo_kept      TEXT, -- base64 data URL, only populated if user explicitly opted in
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_log_user_time ON sessions_log (user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS badges_granted (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id        TEXT NOT NULL,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- Mutual friendship for the "Circle" leaderboard. A row is created in both
-- directions once accepted, so a simple SELECT per user_id gives the circle.
CREATE TABLE IF NOT EXISTS friendships (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);
