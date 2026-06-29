import db from "../database/database.js";

class ActivityLog {
  static create({
    user_id,
    action,
    method,
    entity,
    entity_id,
    path,
    query,
    body,
    status_code,
  }) {
    const stmt = db.prepare(`
      INSERT INTO activity_logs
        (user_id, action, method, entity, entity_id, path, query, body, status_code)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      user_id ?? null,
      action,
      method,
      entity ?? null,
      entity_id ?? null,
      path,
      query ?? null,
      body ?? null,
      status_code ?? null,
    );

    return result.lastInsertRowid;
  }
}

export default ActivityLog;

