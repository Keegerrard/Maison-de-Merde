-- Maison de Merde schema (v2) — SQLite dev-mode variant. Mirrors
-- src/migrations/postgres/002_social.sql column-for-column; see 001_init.sql
-- for the dialect-difference rationale (this file follows the same rules).

CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  read_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages (sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_thread_rev ON messages (recipient_id, sender_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  payload         TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  read_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shared_sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      INTEGER NOT NULL REFERENCES sessions_log(id) ON DELETE CASCADE,
  shared_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (session_id, shared_with)
);

CREATE INDEX IF NOT EXISTS idx_shared_sessions_recipient ON shared_sessions (shared_with, created_at DESC);
