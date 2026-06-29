import db from "./database.js";

db.prepare(`
CREATE TABLE IF NOT EXISTS visit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id INTEGER NOT NULL,
    office_id INTEGER NOT NULL,
    purpose TEXT,
    status TEXT,
    time_in DATETIME DEFAULT CURRENT_TIMESTAMP,
    time_out DATETIME,
    logged_by INTEGER,

    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
    FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE SET NULL
);
`).run();