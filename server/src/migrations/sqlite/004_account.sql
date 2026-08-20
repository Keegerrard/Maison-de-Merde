-- Maison de Merde schema (v4) — SQLite dev-mode variant. Mirrors
-- src/migrations/postgres/004_account.sql; see 001_init.sql for the
-- dialect-difference rationale.

CREATE TABLE IF NOT EXISTS password_resets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  expires_at      TEXT NOT NULL,
  used_at         TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets (user_id, created_at DESC);
