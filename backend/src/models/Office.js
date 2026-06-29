import db from "../database/database.js";

class Office {
  // For staff dashboard: includes queue count
  static findDashboardById(id) {
    const stmt = db.prepare(`
      SELECT
        o.*,
        COALESCE((
          SELECT COUNT(*)
          FROM visit_logs vl
          WHERE vl.office_id = o.id AND vl.time_out IS NULL
        ), 0) AS queue_count
      FROM offices o
      WHERE o.id = ?
    `);
    return stmt.get(id);
  }

  static create(officeData) {
    const {
      office_name,
      latitude,
      longitude,
      type,
      status = "available",
    } = officeData;

    const stmt = db.prepare(`
      INSERT INTO offices (office_name, status, latitude, longitude, type)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(office_name, status, latitude, longitude, type);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT * FROM offices WHERE id = ?
    `);
    return stmt.get(id);
  }

  static findAll() {
    const stmt = db.prepare(`
      SELECT
        o.*,
        COALESCE((
          SELECT COUNT(*)
          FROM visit_logs vl
          WHERE vl.office_id = o.id AND vl.time_out IS NULL
        ), 0) AS queue_count
      FROM offices o
    `);
    return stmt.all();
  }

  static findByName(office_name) {
    const stmt = db.prepare(`
      SELECT * FROM offices WHERE office_name = ?
    `);
    return stmt.get(office_name);
  }

  static update(id, officeData) {
    const { office_name, latitude, longitude, type, status } = officeData;

    const stmt = db.prepare(`
      UPDATE offices 
      SET office_name = ?, latitude = ?, longitude = ?, type = ?, status = ?
      WHERE id = ?
    `);

    const result = stmt.run(office_name, latitude, longitude, type, status, id);
    return result.changes > 0;
  }

  static updateStatus(id, status) {
    const stmt = db.prepare(`
      UPDATE offices
      SET status = ?
      WHERE id = ?
    `);

    const result = stmt.run(status, id);
    return result.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare(`
      DELETE FROM offices WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export default Office;
