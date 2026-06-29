import db from "./database.js";

db.prepare(`
CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    contact_number TEXT,
    address TEXT,
    id_type TEXT,
    img TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`).run();