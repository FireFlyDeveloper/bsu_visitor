import db from "../database/database.js";

export function assignedOfficeOnly(req, res, next) {
  const officeId = Number(req.params.officeId ?? req.params.officeId ?? req.body?.office_id);
  if (!Number.isInteger(officeId) || officeId < 1) {
    return res.status(400).json({ error: "Invalid office id" });
  }

  if (req.user.role === "admin") return next();
  const user = db.prepare("SELECT office_id FROM users WHERE id = ?").get(req.user.id);
  if (!user?.office_id || Number(user.office_id) !== officeId) {
    return res.status(403).json({ error: "You can only access your assigned office" });
  }
  next();
}

export function visitOfficeOnly(req, res, next) {
  if (req.user.role === "admin") return next();
  const id = Number(req.params.id);
  const log = db.prepare("SELECT office_id FROM visit_logs WHERE id = ?").get(id);
  const user = db.prepare("SELECT office_id FROM users WHERE id = ?").get(req.user.id);
  if (!log) return res.status(404).json({ error: "Visit log not found" });
  if (!user?.office_id || Number(user.office_id) !== Number(log.office_id)) {
    return res.status(403).json({ error: "You can only access visits in your assigned office" });
  }
  next();
}
