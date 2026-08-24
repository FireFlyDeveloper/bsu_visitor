import db from "./database.js";

function addColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((item) => item.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

db.prepare(`CREATE TABLE IF NOT EXISTS system_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL
)`).run();
db.prepare(`INSERT OR IGNORE INTO system_settings (setting_key, setting_value)
  VALUES ('exit_grace_minutes', '30')`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS visitor_access_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_log_id INTEGER NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_log_id) REFERENCES visit_logs(id) ON DELETE CASCADE
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  audience TEXT NOT NULL,
  visit_log_id INTEGER,
  endpoint TEXT NOT NULL UNIQUE,
  subscription_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS notification_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audience TEXT NOT NULL,
  office_id INTEGER,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME
)`).run();

addColumn("visit_logs", "exit_deadline", "DATETIME");
addColumn("visit_logs", "overdue_acknowledged_at", "DATETIME");
addColumn("notification_events", "dedup_key", "TEXT");
// Visitor push: subscriptions tied to a specific visit log.
addColumn("push_subscriptions", "visit_log_id", "INTEGER");

// Repair legacy databases before enforcing notification idempotency. Duplicate
// keys can exist in databases created before this index was introduced.
db.prepare(`DELETE FROM notification_events
  WHERE dedup_key IS NOT NULL AND id NOT IN (
    SELECT MIN(id) FROM notification_events
    WHERE dedup_key IS NOT NULL GROUP BY dedup_key
  )`).run();
db.prepare(`DROP INDEX IF EXISTS idx_notification_events_dedup`).run();
db.prepare(`CREATE UNIQUE INDEX idx_notification_events_dedup
  ON notification_events(dedup_key) WHERE dedup_key IS NOT NULL`).run();
