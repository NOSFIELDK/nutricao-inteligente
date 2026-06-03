CREATE TABLE IF NOT EXISTS sync_items (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);
