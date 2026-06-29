import crypto from "crypto";
import db from "../database/database.js";

class VisitorLink {
  static findAll() {
    return db
      .prepare(
        `
    SELECT vl.*, v.fullname as visitor_name, v.contact_number, v.address,
           o.office_name, o.latitude, o.longitude, o.type
    FROM visitor_links vl
    JOIN visitors v ON vl.visitor_id = v.id
    LEFT JOIN offices o ON vl.office_id = o.id
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
      SELECT vl.*, v.fullname AS visitor_name, v.contact_number, v.address, o.office_name, o.latitude, o.longitude, o.type
      FROM visitor_links vl
      JOIN visitors v ON v.id = vl.visitor_id
      JOIN offices o ON o.id = vl.office_id
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
