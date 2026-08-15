import db from "./database.js";

const columns = db.prepare("PRAGMA table_info(visit_logs)").all();
const addColumn = (name, definition) => {
  if (!columns.some((column) => column.name === name)) {
    db.prepare(`ALTER TABLE visit_logs ADD COLUMN ${name} ${definition}`).run();
  }
};

addColumn("access_token_hash", "TEXT");
addColumn("reference_number", "TEXT");
addColumn("registration_source", "TEXT DEFAULT 'self'");
addColumn("exit_deadline", "DATETIME");
addColumn("overdue_acknowledged_at", "DATETIME");

db.prepare(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_visit_logs_access_token_hash
  ON visit_logs(access_token_hash)
`).run();
db.prepare(`
  CREATE TABLE IF NOT EXISTS mvp_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();
db.prepare(`
  INSERT OR IGNORE INTO mvp_settings(key, value) VALUES ('exit_grace_minutes', '30')
`).run();