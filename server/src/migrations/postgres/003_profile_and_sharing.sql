-- Maison de Merde schema (v3) — public/private profiles + richer sharing.
-- Idempotent, same pattern as 001/002: only CREATE TABLE IF NOT EXISTS, no
-- ALTER TABLE on existing tables (Postgres supports ADD COLUMN IF NOT
-- EXISTS, but the SQLite variant of this file can't express that safely,
-- so both variants add new tables instead — see sqlite/003 for details).

-- One row per user, created lazily on first profile write. nickname falls
-- back to username when null; trait_badge_id must be one of the caller's
-- own unlocked badges (enforced in routes/profile.js, not here).
CREATE TABLE IF NOT EXISTS profiles (
  user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname        TEXT,
  banner          TEXT NOT NULL DEFAULT 'sage',
  trait_badge_id  TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT false,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-share caption + explicit photo-inclusion flag. Kept in its own table
-- (rather than altering shared_sessions) so sharing a session's photo is
-- opt-in per share, not inherited from whatever the owner did with
-- keepPhoto when they originally logged it.
CREATE TABLE IF NOT EXISTS share_notes (
  shared_session_id INTEGER PRIMARY KEY REFERENCES shared_sessions(id) ON DELETE CASCADE,
  caption           TEXT,
  include_photo     BOOLEAN NOT NULL DEFAULT false
);
