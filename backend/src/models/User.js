import db from "../database/database.js";
import bcrypt from "bcrypt";

class User {
  static create(userData) {
    const { fullname, username, password, role_id, office_id } = userData;
    const normalizedOfficeId = office_id ?? null;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (fullname, username, password_hash, role_id, office_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      fullname,
      username,
      hashedPassword,
      role_id,
      normalizedOfficeId,
    );
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare(`
    SELECT 
      u.id,
      u.fullname,
      u.username,
      u.role_id,
      u.office_id,
      u.created_at,
      r.role_name AS role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `);

    const user = stmt.get(id);

    if (!user) return null;

    return {
      ...user,
      role: {
        id: user.role_id,
        name: user.role_name,
      },
    };
  }

  static findByUsername(username) {
    const stmt = db.prepare(`
    SELECT 
      u.*,
      r.role_name AS role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username = ?
  `);

    const user = stmt.get(username);

    if (!user) return null;

    return {
      ...user,
      role: {
        id: user.role_id,
        name: user.role_name,
      },
    };
  }

  static findAll() {
    const stmt = db.prepare(`
      SELECT
        u.id,
        u.fullname,
        u.username,
        u.role_id,
        u.office_id,
        u.created_at,
        r.role_name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    const rows = stmt.all();

    return rows.map((user) => ({
      ...user,
      role: {
        id: user.role_id,
        name: user.role_name,
      },
    }));
  }

  static findAllWithLastActivity() {
    const stmt = db.prepare(`
      SELECT 
        u.id,
        u.fullname,
        u.username,
        u.role_id,
        u.office_id,
        u.created_at,
        COALESCE(MAX(l.time_in), u.created_at) as last_activity
      FROM users u
      LEFT JOIN visit_logs l ON u.id = l.logged_by
      GROUP BY u.id
      ORDER BY COALESCE(MAX(l.time_in), u.created_at) DESC
    `);
    return stmt.all();
  }

  static update(id, userData) {
    const { fullname, username, role_id, office_id } = userData;
    const normalizedOfficeId = office_id ?? null;

    const stmt = db.prepare(`
      UPDATE users 
      SET fullname = ?, username = ?, role_id = ?, office_id = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      fullname,
      username,
      role_id,
      normalizedOfficeId,
      id,
    );
    return result.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare(`
      DELETE FROM users WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }

  static verifyPassword(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword);
  }
}

export default User;
