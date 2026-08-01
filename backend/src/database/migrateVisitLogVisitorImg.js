import db from "./database.js";

// Idempotent migration: keep the visitor photo captured for each visit log.
// The visitor profile photo may change on a repeat visit, but historical logs
// must keep the image taken for that specific log.
const cols = db.prepare("PRAGMA table_info(visit_logs)").all();
const hasVisitorImg = cols.some((c) => c.name === "visitor_img");

if (!hasVisitorImg) {
  db.prepare("ALTER TABLE visit_logs ADD COLUMN visitor_img TEXT").run();
  console.log("[migrate] visit_logs.visitor_img added");
} else {
  console.log("[migrate] visit_logs.visitor_img already present");
}
