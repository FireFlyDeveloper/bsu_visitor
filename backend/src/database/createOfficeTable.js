import db from "./database.js";

db.prepare(`
CREATE TABLE IF NOT EXISTS offices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    office_name TEXT NOT NULL,
    status TEXT,
    latitude TEXT,
    longitude TEXT,
    type TEXT
);
`).run();

