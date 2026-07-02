import db from "../database/database.js";

class Visitor {
  static create(visitorData) {
    const { fullname, contact_number, address, id_type, img } = visitorData;

    const stmt = db.prepare(`
      INSERT INTO visitors (fullname, contact_number, address, id_type, img)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(fullname, contact_number, address, id_type, img);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT * FROM visitors WHERE id = ?
    `);
    return stmt.get(id);
  }

  static findAll(search = "") {
    let stmt;

    if (search && search.trim() !== "") {
      stmt = db.prepare(`
      SELECT * FROM visitors
      WHERE fullname LIKE ?
      ORDER BY fullname ASC
    `);

      return stmt.all(`%${search}%`);
    } else {
      stmt = db.prepare(`
      SELECT * FROM visitors
      ORDER BY fullname ASC
    `);

      return stmt.all();
    }
  }

  static findByFullname(fullname) {
    const stmt = db.prepare(`
      SELECT * FROM visitors WHERE fullname = ?
    `);
    return stmt.get(fullname);
  }

  static findByContactNumber(contact_number) {
    const stmt = db.prepare(`
      SELECT * FROM visitors WHERE contact_number = ?
    `);
    return stmt.get(contact_number);
  }

  static update(id, visitorData) {
    // Build a dynamic SET clause so callers can pass a partial payload
    // (e.g. kiosk re-register reuses an existing visitor and only
    // updates the photo). The previous full-column UPDATE was a footgun
    // that set unset fields to NULL, tripping the NOT NULL constraint.
    const ALLOWED = ["fullname", "contact_number", "address", "id_type", "img"];
    const fields = Object.keys(visitorData || {}).filter(
      (k) => ALLOWED.includes(k) && visitorData[k] !== undefined,
    );
    if (fields.length === 0) {
      // Nothing to update — return the row as-is so callers can still
      // observe .changes.
      return db.prepare("SELECT * FROM visitors WHERE id = ?").get(id);
    }
    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => visitorData[f]);
    const stmt = db.prepare(
      `UPDATE visitors SET ${setClause} WHERE id = ?`,
    );
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare(`
      DELETE FROM visitors WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export default Visitor;
