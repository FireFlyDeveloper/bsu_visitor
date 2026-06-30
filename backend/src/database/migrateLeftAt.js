import db from "./database.js";

// Idempotent migration: add `left_at` to visit_logs if it doesn't exist.
// Safe to run on every server start.
const cols = db.prepare("PRAGMA table_info(visit_logs)").all();
const hasLeftAt = cols.some((c) => c.name === "left_at");
if (!hasLeftAt) {
  db.prepare("ALTER TABLE visit_logs ADD COLUMN left_at DATETIME").run();
  console.log("[migrate] visit_logs.left_at added");
} else {
  console.log("[migrate] visit_logs.left_at already present");
}
