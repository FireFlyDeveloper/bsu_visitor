import db from "../database/database.js";
import Setting from "./Setting.js";

class VisitorStatus {
  /**
   * Update the status of a visit log (e.g. pending → approved / rejected / completed)
   */
  static updateStatus({ visitLogId, status }) {
    if (!visitLogId) throw new Error("visitLogId is required");
    if (!status) throw new Error("status is required");

    let query = `
    UPDATE visit_logs
    SET status = ?
  `;

    const params = [status];

    if (status === "completed") {
      // Set the authoritative shared exit deadline on completion.
      const graceMinutes = Setting.getExitGraceMinutes();
      query += `, time_out = COALESCE(time_out, CURRENT_TIMESTAMP), exit_deadline = COALESCE(exit_deadline, datetime(CURRENT_TIMESTAMP, '+' || ? || ' minutes'))`;
      params.push(graceMinutes);
    }

    if (status === "left") {
      query += `, left_at = COALESCE(left_at, CURRENT_TIMESTAMP), time_out = COALESCE(time_out, CURRENT_TIMESTAMP)`;
    }

    query += ` WHERE id = ?`;
    params.push(visitLogId);

    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    return result.changes > 0;
  }

  /**
   * Bulk update status by office (useful for admin actions)
   */
  static updateStatusByOffice({ officeId, status, currentStatus = null }) {
    if (!officeId) throw new Error("officeId is required");
    if (!status) throw new Error("status is required");

    const conditions = ["office_id = ?"];
    const params = [officeId];

    if (currentStatus) {
      conditions.push("status = ?");
      params.push(currentStatus);
    }

    const stmt = db.prepare(`
      UPDATE visit_logs
      SET status = ?
      WHERE ${conditions.join(" AND ")}
    `);

    const result = stmt.run(status, ...params);
    return result.changes;
  }

  // Global (admin) variant: all offices, same queue-number projection.
  static findByStatus({ status, limit = 20, offset = 0 }) {
    if (!status) throw new Error("status is required");

    const rows = db
      .prepare(
        `
    SELECT
      l.*,
      v.fullname AS visitor_name,
      v.contact_number,
      v.address AS visitor_address,
      COALESCE(l.visitor_img, v.img) AS visitor_img,
      o.office_name,
      (
        SELECT COUNT(*) + 1
        FROM visit_logs q
        WHERE q.office_id = l.office_id
          AND q.status IN ('pending', 'processing')
          AND q.left_at IS NULL
          AND q.id < l.id
      ) AS queue_number
    FROM visit_logs l
    JOIN visitors v ON v.id = l.visitor_id
    JOIN offices o ON o.id = l.office_id
    WHERE l.status = ?
    ORDER BY l.time_in DESC
    LIMIT ? OFFSET ?
  `,
      )
      .all(status, limit, offset);

    const total = db
      .prepare(`SELECT COUNT(*) AS total FROM visit_logs WHERE status = ?`)
      .get(status).total;

    return { rows, total };
  }

  static findByStatusAndOffice({ userId, status, limit = 20, offset = 0 }) {
    if (!userId) throw new Error("userId is required");
    if (!status) throw new Error("status is required");

    const rows = db
      .prepare(
        `
    SELECT
      l.*,
      v.fullname AS visitor_name,
      v.contact_number,
      v.address AS visitor_address,
      COALESCE(l.visitor_img, v.img) AS visitor_img,
      o.office_name,
      -- Queue number mirrors the visitor-facing queuePosition(): earlier
      -- pending/processing visits at the same office, plus this one.
      (
        SELECT COUNT(*) + 1
        FROM visit_logs q
        WHERE q.office_id = l.office_id
          AND q.status IN ('pending', 'processing')
          AND q.left_at IS NULL
          AND q.id < l.id
      ) AS queue_number
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
