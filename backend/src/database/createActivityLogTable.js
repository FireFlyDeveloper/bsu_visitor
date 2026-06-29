import db from "./database.js";

db.prepare(`
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    method TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    path TEXT NOT NULL,
    query TEXT,
    body TEXT,
    status_code INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
`).run();

