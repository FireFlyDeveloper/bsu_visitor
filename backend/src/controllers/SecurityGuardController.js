import Office from "../models/Office.js";
import db from "../database/database.js";

class SecurityController {
  static pendingSignOut(req, res) {
    const rows = db.prepare(`SELECT l.id, l.office_id, l.status, l.time_out, l.exit_deadline,
      v.fullname AS visitor_name, o.office_name,
      CASE WHEN l.exit_deadline IS NOT NULL AND datetime(l.exit_deadline) <= datetime('now') THEN 1 ELSE 0 END AS overdue
      FROM visit_logs l JOIN visitors v ON v.id = l.visitor_id JOIN offices o ON o.id = l.office_id
      WHERE l.status = 'completed' AND l.left_at IS NULL ORDER BY overdue DESC, l.time_out ASC`).all();
    return res.json({ total: rows.length, data: rows });
  }

  static acknowledgeOverdue(req, res) {
    const result = db.prepare(`UPDATE visit_logs SET overdue_acknowledged_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'completed' AND left_at IS NULL`).run(req.params.visitId);
    if (!result.changes) return res.status(404).json({ error: "Overdue visit not found" });
    return res.json({ ok: true });
  }
  static updateOfficeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate input
      if (!id) {
        return res.status(400).json({ error: "Office ID is required" });
      }

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Check if office exists
      const office = Office.findById(id);
      if (!office) {
        return res.status(404).json({ error: "Office not found" });
      }

      // Update status
      const updated = Office.updateStatus(id, status);

      if (!updated) {
        return res
          .status(500)
          .json({ error: "Failed to update office status" });
      }

      return res.status(200).json({
        message: "Office status updated successfully",
        office_id: id,
        new_status: status,
      });
    } catch (error) {
      console.error("Update Office Status Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default SecurityController;
