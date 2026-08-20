-- Maison de Merde schema (v4) — password reset tokens.
-- Idempotent, same pattern as 001-003.

-- A reset token is single-use and short-lived. Only the SHA-256 hash of the
-- raw token is stored (same principle as password hashing: if this table
-- leaked, the raw tokens still couldn't be reconstructed). The raw token
-- itself is only ever held in memory long enough to return it to the
-- request that created it.
CREATE TABLE IF NOT EXISTS password_resets (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets (user_id, created_at DESC);
