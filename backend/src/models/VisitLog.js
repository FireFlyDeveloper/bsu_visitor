import db from "../database/database.js";

class VisitLog {
  static create(logData) {
    const {
      visitor_id,
      office_id,
      purpose,
      logged_by,
      status = "pending",
    } = logData;

    const stmt = db.prepare(`
    INSERT INTO visit_logs (visitor_id, office_id, purpose, logged_by, status)
    VALUES (?, ?, ?, ?, ?)
  `);

    const result = stmt.run(visitor_id, office_id, purpose, logged_by, status);
    return result.lastInsertRowid;
  }

  static countPerOffice() {
    const stmt = db.prepare(`
    SELECT 
      l.office_id,
      o.office_name,
      COUNT(*) AS total_visits
    FROM visit_logs l
    JOIN offices o ON o.id = l.office_id
    GROUP BY l.office_id
    ORDER BY total_visits DESC
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
      vl.token,
      v.fullname AS visitor_name,
      v.contact_number,
      v.address AS visitor_address,
      o.office_name
    FROM visit_logs l
    JOIN visitors v ON v.id = l.visitor_id
    JOIN offices o ON o.id = l.office_id
    LEFT JOIN visitor_links vl 
      ON vl.id = (
        SELECT id FROM visitor_links 
        WHERE visitor_id = l.visitor_id 
        ORDER BY created_at DESC 
        LIMIT 1
      )
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
      SELECT * FROM visit_logs WHERE time_out IS NULL
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
      vl.token,
      v.fullname AS visitor_name,
      v.contact_number,
      v.address AS visitor_address,
      o.office_name
    FROM visit_logs l
    JOIN visitors v ON v.id = l.visitor_id
    JOIN offices o ON o.id = l.office_id
    JOIN user_offices uo ON uo.office_id = l.office_id
    LEFT JOIN visitor_links vl 
      ON vl.id = (
        SELECT id FROM visitor_links 
        WHERE visitor_id = l.visitor_id 
        ORDER BY created_at DESC 
        LIMIT 1
      )
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
        vl.token,
        v.fullname AS visitor_name,
        v.contact_number,
        v.address AS visitor_address,
        o.office_name
      FROM visit_logs l
      JOIN visitors v ON v.id = l.visitor_id
      JOIN offices o ON o.id = l.office_id
      JOIN users u ON u.office_id = l.office_id
      LEFT JOIN visitor_links vl 
        ON vl.id = (
          SELECT id FROM visitor_links 
          WHERE visitor_id = l.visitor_id 
          ORDER BY created_at DESC 
          LIMIT 1
        )
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
