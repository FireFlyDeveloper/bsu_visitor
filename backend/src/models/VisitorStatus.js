import db from "../database/database.js";
import { getExitGraceMinutes, recordNotification } from "./Mvp.js";

class VisitorStatus {
  static allowed = new Set(["pending", "processing", "completed", "rejected", "left"]);
  static transitions = {
    pending: new Set(["processing", "completed", "rejected"]),
    processing: new Set(["completed", "rejected"]),
    completed: new Set(["left"]),
    rejected: new Set(),
    left: new Set(),
  };
  /**
   * Update the status of a visit log (e.g. pending → approved / rejected / completed)
   */
  static updateStatus({ visitLogId, status }) {
    if (!visitLogId) throw new Error("visitLogId is required");
    if (!this.allowed.has(status)) throw new Error("Invalid visitor status");
    const current = db.prepare("SELECT status FROM visit_logs WHERE id = ?").get(visitLogId);
    if (!current) return false;
    if (current.status !== status && !this.transitions[current.status]?.has(status)) {
      throw new Error(`Invalid status transition from ${current.status} to ${status}`);
    }

    let query = `
    UPDATE visit_logs
    SET status = ?
  `;

    const params = [status];

    if (status === "completed") {
      query += `, time_out = COALESCE(time_out, CURRENT_TIMESTAMP), exit_deadline = COALESCE(exit_deadline, datetime('now', '+' || ? || ' minutes'))`;
      params.push(getExitGraceMinutes());
    }

    if (status === "left") {
      query += `, left_at = COALESCE(left_at, CURRENT_TIMESTAMP), time_out = COALESCE(time_out, CURRENT_TIMESTAMP)`;
    }

    query += ` WHERE id = ?`;
    params.push(visitLogId);

    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    if (result.changes > 0 && status === "completed") {
      const office = db.prepare("SELECT office_id FROM visit_logs WHERE id = ?").get(visitLogId);
      recordNotification("security", office?.office_id, "visit_completed", { visit_id: visitLogId });
    }

    return result.changes > 0;
  }

  /**
   * Bulk update status by office (useful for admin actions)
   */
  static updateStatusByOffice({ officeId, status, currentStatus = null }) {
    if (!officeId) throw new Error("officeId is required");
    if (!this.allowed.has(status)) throw new Error("Invalid visitor status");

    const conditions = ["office_id = ?"];
    const params = [officeId];

    if (currentStatus) {
      conditions.push("status = ?");
      params.push(currentStatus);
    }

    const ids = db.prepare(`SELECT id, status FROM visit_logs WHERE ${conditions.join(" AND ")}`).all(...params);
    for (const row of ids) {
      if (row.status !== status && !this.transitions[row.status]?.has(status)) {
        throw new Error(`Invalid status transition from ${row.status} to ${status}`);
      }
    }
    const sideEffects = status === "completed"
      ? ", time_out = COALESCE(time_out, CURRENT_TIMESTAMP), exit_deadline = COALESCE(exit_deadline, datetime('now', '+' || " + getExitGraceMinutes() + " || ' minutes'))"
      : status === "left"
        ? ", time_out = COALESCE(time_out, CURRENT_TIMESTAMP), left_at = COALESCE(left_at, CURRENT_TIMESTAMP)"
        : "";
    const stmt = db.prepare(`
      UPDATE visit_logs
      SET status = ?
          ${sideEffects}
      WHERE ${conditions.join(" AND ")}
    `);

    const result = stmt.run(status, ...params);
    return result.changes;
  }

  static findByStatusAndOffice({ userId, status, limit = 20, offset = 0 }) {
    if (!userId) throw new Error("userId is required");
    if (!this.allowed.has(status)) throw new Error("Invalid visitor status");

    const rows = db
      .prepare(
        `
    SELECT
      l.*,
      v.fullname AS visitor_name,
      v.contact_number,
      v.address AS visitor_address,
      COALESCE(l.visitor_img, v.img) AS visitor_img,
      o.office_name
    FROM visit_logs l
    JOIN visitors v ON v.id = l.visitor_id
    JOIN offices o ON o.id = l.office_id
    JOIN users u ON u.office_id = l.office_id
    WHERE
      u.id = ?
      AND l.status = ?
      AND l.office_id = u.office_id
    ORDER BY l.time_in DESC
    LIMIT ? OFFSET ?
  `,
      )
      .all(userId, status, limit, offset);

    const total = db
      .prepare(
        `
    SELECT COUNT(*) AS total
    FROM visit_logs l
    JOIN users u ON u.office_id = l.office_id
    WHERE 
      u.id = ?
      AND l.status = ?
      AND l.office_id = u.office_id
  `,
      )
      .get(userId, status).total;

    return { rows, total };
  }

  static findByStatus({ status, limit = 20, offset = 0 }) {
    if (!this.allowed.has(status)) throw new Error("Invalid visitor status");
    const rows = db.prepare(`
      SELECT l.*, v.fullname AS visitor_name, o.office_name
      FROM visit_logs l JOIN visitors v ON v.id = l.visitor_id JOIN offices o ON o.id = l.office_id
      WHERE l.status = ? ORDER BY l.time_in DESC LIMIT ? OFFSET ?
    `).all(status, limit, offset);
    const total = db.prepare("SELECT COUNT(*) AS total FROM visit_logs WHERE status = ?").get(status).total;
    return { rows, total };
  }

  /**
   * Get status summary per office (useful for dashboard)
   */
  static countByOffice({ officeId }) {
    if (!officeId) throw new Error("officeId is required");

    const stmt = db.prepare(`
      SELECT status, COUNT(*) AS count
      FROM visit_logs
      WHERE office_id = ?
      GROUP BY status
    `);

    return stmt.all(officeId);
  }
}

export default VisitorStatus;
