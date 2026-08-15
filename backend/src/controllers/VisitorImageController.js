import fs from "node:fs";
import path from "node:path";
import db from "../database/database.js";

export function serveVisitorImage(req, res) {
  const filename = path.basename(req.params.filename);
  const row = db.prepare(`
    SELECT l.office_id FROM visit_logs l
    WHERE l.visitor_img = ? OR l.visitor_id IN (SELECT id FROM visitors WHERE img = ?)
    LIMIT 1
  `).get(`uploads/${filename}`, `uploads/${filename}`);
  if (!row) return res.status(404).json({ error: "Image not found" });
  if (req.user.role !== "admin") {
    const user = db.prepare("SELECT office_id FROM users WHERE id = ?").get(req.user.id);
    if (req.user.role !== "security" && Number(user?.office_id) !== Number(row.office_id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }
  const file = path.resolve("uploads", filename);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Image not found" });
  return res.sendFile(file);
}
