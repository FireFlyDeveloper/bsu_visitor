import crypto from "crypto";
import db from "../database/database.js";

class VisitorLink {
  static findAll() {
    // Only return links whose underlying visit log is still in-progress
    // (i.e. status is NOT in a terminal state AND time_out is NULL).
    // This is the fix for the known bug "QR code still showing after status is left".
    return db
      .prepare(
        `
    SELECT vl.*, v.fullname as visitor_name, v.contact_number, v.address,
           o.office_name, o.latitude, o.longitude, o.type
    FROM visitor_links vl
    JOIN visitors v ON vl.visitor_id = v.id
    LEFT JOIN offices o ON vl.office_id = o.id
    LEFT JOIN visit_logs vl2 ON vl2.id = (
      SELECT id FROM visit_logs
      WHERE visitor_id = vl.visitor_id
      ORDER BY time_in DESC
      LIMIT 1
    )
    WHERE vl2.time_out IS NULL
      AND vl2.status NOT IN ('completed', 'rejected', 'cancelled')
    ORDER BY vl.created_at DESC
  `,
      )
      .all();
  }

  static create(visitor_id, office_id) {
    const token = crypto.randomBytes(24).toString("hex");

    const stmt = db.prepare(`
      INSERT INTO visitor_links (visitor_id, office_id, token)
      VALUES (?, ?, ?)
    `);

    stmt.run(visitor_id, office_id, token);
    return token;
  }

  static findByToken(token) {
    const stmt = db.prepare(`
      SELECT vl.*, v.fullname AS visitor_name, v.contact_number, v.address, o.office_name, o.latitude, o.longitude, o.type,
             l.status AS visit_status, l.time_out AS visit_time_out
      FROM visitor_links vl
      JOIN visitors v ON vl.visitor_id = v.id
      JOIN offices o ON vl.office_id = o.id
      LEFT JOIN visit_logs l
        ON l.id = (
          SELECT id FROM visit_logs
          WHERE visitor_id = vl.visitor_id
          ORDER BY time_in DESC
          LIMIT 1
        )
      WHERE vl.token = ?
    `);
    return stmt.get(token);
  }

  static isExpired(link, maxAgeMs = 8 * 60 * 60 * 1000) {
    if (!link || !link.created_at) return true;
    const createdAt = new Date(link.created_at).getTime();
    return Date.now() - createdAt > maxAgeMs;
  }
}

export default VisitorLink;
