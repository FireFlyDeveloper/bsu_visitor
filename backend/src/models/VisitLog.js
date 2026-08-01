import db from "../database/database.js";

class VisitLog {
  static create(logData) {
    const {
      visitor_id,
      office_id,
      purpose,
      logged_by,
      status = "pending",
      visitor_img = null,
    } = logData;

    const stmt = db.prepare(`
    INSERT INTO visit_logs (visitor_id, office_id, purpose, logged_by, status, visitor_img)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    const result = stmt.run(visitor_id, office_id, purpose, logged_by, status, visitor_img);
    return result.lastInsertRowid;
  }

  static countPerOffice() {
    const stmt = db.prepare(`
      SELECT
        o.id AS office_id,
        o.office_name,
        'pending' AS status,
        COALESCE(COUNT(l.id), 0) AS total_visits
      FROM offices o
      LEFT JOIN visit_logs l
        ON l.office_id = o.id
        AND l.status IN ('pending', 'processing')
        AND l.left_at IS NULL
      GROUP BY o.id
      ORDER BY total_visits DESC, o.office_name ASC
    `);

    return stmt.all();
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT * FROM visit_logs WHERE id = ?
    `);
    return stmt.get(id);
  }

  static findAll() {
    const stmt = db.prepare(`
      SELECT * FROM visit_logs
    `);
    return stmt.all();
  }

  static findLogs({
    visitorName,
    startDate,
    endDate,
    limit = 20,
    offset = 0,
  } = {}) {
    const conditions = [];
    const params = [];

    if (visitorName) {
      conditions.push("LOWER(v.fullname) LIKE LOWER(?)");
      params.push(`%${visitorName}%`);
    }

    if (startDate) {
      conditions.push("DATE(l.time_in) >= DATE(?)");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("DATE(l.time_in) <= DATE(?)");
      params.push(endDate);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

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
    ${whereClause}
    ORDER BY l.time_in DESC
    LIMIT ? OFFSET ?
  `,
      )
      .all(...params, limit, offset);

    const countStmt = db.prepare(`
      SELECT COUNT(*) AS total
      FROM visit_logs l
      JOIN visitors v ON v.id = l.visitor_id
      JOIN offices o ON o.id = l.office_id
      ${whereClause}
    `);
    const total = countStmt.get(...params).total;

    return { rows, total };
  }

  static findByVisitorId(visitor_id) {
    const stmt = db.prepare(`
      SELECT * FROM visit_logs WHERE visitor_id = ?
    `);
    return stmt.all(visitor_id);
  }

  static findByOfficeId(office_id) {
    const stmt = db.prepare(`
      SELECT * FROM visit_logs WHERE office_id = ?
    `);
    return stmt.all(office_id);
  }

  static findActiveVisits() {
    const stmt = db.prepare(`
      SELECT *
      FROM visit_logs
      WHERE left_at IS NULL
      ORDER BY time_in DESC
    `);
    return stmt.all();
  }

  static update(id, logData) {
    const { visitor_id, office_id, purpose, logged_by } = logData;

    const stmt = db.prepare(`
      UPDATE visit_logs 
      SET visitor_id = ?, office_id = ?, purpose = ?, logged_by = ?
      WHERE id = ?
    `);

    const result = stmt.run(visitor_id, office_id, purpose, logged_by, id);
    return result.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare(`
      DELETE FROM visit_logs WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }

  // This method is specifically for staff users to view logs related to their assigned offices
  static findLogsByUserOffices({
    userId,
    visitorName,
    startDate,
    endDate,
    limit = 20,
    offset = 0,
  }) {
    if (!userId) {
      throw new Error("userId is required for staff access");
    }

    const conditions = ["uo.user_id = ?"];
    const params = [userId];

    if (visitorName) {
      conditions.push("LOWER(v.fullname) LIKE LOWER(?)");
      params.push(`%${visitorName}%`);
    }

    if (startDate) {
      conditions.push("DATE(l.time_in) >= DATE(?)");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("DATE(l.time_in) <= DATE(?)");
      params.push(endDate);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

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
    JOIN user_offices uo ON uo.office_id = l.office_id
    ${whereClause}
    ORDER BY l.time_in DESC
    LIMIT ? OFFSET ?
  `,
      )
      .all(...params, limit, offset);

    const countStmt = db.prepare(`
    SELECT COUNT(*) AS total
    FROM visit_logs l
    JOIN visitors v ON v.id = l.visitor_id
    JOIN offices o ON o.id = l.office_id
    JOIN user_offices uo ON uo.office_id = l.office_id
    ${whereClause}
  `);

    const total = countStmt.get(...params).total;

    return { rows, total };
  }

  static markDone(id) {
    const stmt = db.prepare(`
      UPDATE visit_logs
      SET status = 'completed',
          time_out = COALESCE(time_out, CURRENT_TIMESTAMP)
      WHERE id = ? AND status != 'completed'
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static markLeft(id) {
    const stmt = db.prepare(`
      UPDATE visit_logs
      SET left_at = COALESCE(left_at, CURRENT_TIMESTAMP),
          time_out = COALESCE(time_out, CURRENT_TIMESTAMP),
          status = 'left'
      WHERE id = ? AND left_at IS NULL
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static findOverdue({ limit = 50, overdueMinutes = 30 } = {}) {
    // An overdue visit is one that the office has already marked
    // 'completed' (i.e. the visit itself is over) but the visitor
    // has not yet left the guard house. The configurable grace window
    // starts when the visit was completed (time_out), so the alarm
    // only fires once that window has elapsed. Rows where time_out
    // is NULL (legacy data) are kept so they cannot silently slip
    // through the cracks.
    return db
      .prepare(
        `
      SELECT
        l.id,
        l.visitor_id,
        l.office_id,
        l.purpose,
        l.status,
        l.time_in,
        l.time_out,
        l.left_at,
        v.fullname AS visitor_name,
        v.contact_number,
        COALESCE(l.visitor_img, v.img) AS visitor_img,
        o.office_name,
        CASE
          WHEN l.time_out IS NULL THEN NULL
          ELSE CAST(
            (julianday('now') - julianday(l.time_out)) * 24 * 60 AS INTEGER
          )
        END AS minutes_since_completed
      FROM visit_logs l
      JOIN visitors v ON v.id = l.visitor_id
      JOIN offices o ON o.id = l.office_id
      WHERE l.status = 'completed'
        AND l.left_at IS NULL
        AND (
          l.time_out IS NULL
          OR datetime(l.time_out, '+' || ? || ' minutes') <= datetime('now')
        )
      ORDER BY l.time_out DESC NULLS LAST
      LIMIT ?
    `,
      )
      .all(overdueMinutes, limit);
  }

  // This method is for staff users to quickly view pending visits related to their assigned offices
  static findPendingByUserOffice({ userId, limit = 20, offset = 0 }) {
    if (!userId) {
      throw new Error("userId is required");
    }

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
        AND l.status = 'pending'
        AND l.office_id = u.office_id
      ORDER BY l.time_in DESC
      LIMIT ? OFFSET ?
      `,
      )
      .all(userId, limit, offset);

    const total = db
      .prepare(
        `
      SELECT COUNT(*) AS total
      FROM visit_logs l
      JOIN users u ON u.office_id = l.office_id
      WHERE 
        u.id = ?
        AND l.status = 'pending'
        AND l.office_id = u.office_id
      `,
      )
      .get(userId).total;

    return { rows, total };
  }
}

export default VisitLog;
