CREATE TABLE IF NOT EXISTS cms_admin (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_sessions (
  token_hash TEXT PRIMARY KEY,
  csrf TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  resets_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS cms_attempts_expiry ON cms_attempts(resets_at);
CREATE INDEX IF NOT EXISTS cms_sessions_expiry ON cms_sessions(expires_at);
