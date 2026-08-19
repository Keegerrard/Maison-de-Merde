-- Maison de Merde schema (v3) — SQLite dev-mode variant. Mirrors
-- src/migrations/postgres/003_profile_and_sharing.sql; see 001_init.sql for
-- the dialect-difference rationale.

CREATE TABLE IF NOT EXISTS profiles (
  user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname        TEXT,
  banner          TEXT NOT NULL DEFAULT 'sage',
  trait_badge_id  TEXT,
  is_public       INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS share_notes (
  shared_session_id INTEGER PRIMARY KEY REFERENCES shared_sessions(id) ON DELETE CASCADE,
  caption           TEXT,
  include_photo     INTEGER NOT NULL DEFAULT 0
);
