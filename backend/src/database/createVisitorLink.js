import db from "./database.js";

db.prepare(
  `
CREATE TABLE IF NOT EXISTS visitor_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id INTEGER NOT NULL,
    office_id INTEGER,
    token TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`,
).run();

const visitorLinksColumns = db.prepare(`PRAGMA table_info(visitor_links)`).all();
const hasOfficeId = visitorLinksColumns.some((column) => column.name === "office_id");
if (!hasOfficeId) {
  db.prepare(`ALTER TABLE visitor_links ADD COLUMN office_id INTEGER`).run();
}
