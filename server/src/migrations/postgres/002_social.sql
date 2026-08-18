-- Maison de Merde schema (v2) — chat, notifications, session sharing.
-- Idempotent, same pattern as 001_init.sql.

-- 1:1 direct messages between friends. No group chat — every row is one
-- message from sender_id to recipient_id.
CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages (sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_thread_rev ON messages (recipient_id, sender_id, created_at);

-- Generic notification feed. payload is JSON-encoded text (same
-- cross-driver-portability reasoning as sessions_log.symptoms in 001).
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL, -- 'friend_request' | 'friend_accept' | 'message' | 'session_shared'
  payload         TEXT NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);

-- Explicit per-session sharing. A session is only visible to a friend if a
-- row exists here for it — nothing is shared to the Circle by default,
-- consistent with the privacy stance in the README (§8).
CREATE TABLE IF NOT EXISTS shared_sessions (
  id              SERIAL PRIMARY KEY,
  session_id      INTEGER NOT NULL REFERENCES sessions_log(id) ON DELETE CASCADE,
  shared_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, shared_with)
);

CREATE INDEX IF NOT EXISTS idx_shared_sessions_recipient ON shared_sessions (shared_with, created_at DESC);
