import db from "../database/database.js";

const DEFAULT_EXIT_GRACE_MINUTES = 30;
const MIN_EXIT_GRACE_MINUTES = 1;
const MAX_EXIT_GRACE_MINUTES = 720;

/**
 * Authoritative global settings, stored in the mvp_settings key/value
 * table. The exit grace period is a single global value applied to every
 * office: exit_deadline = completion time + exit_grace_minutes.
 */
class Setting {
  static getExitGraceMinutes() {
    const row = db
      .prepare("SELECT value FROM mvp_settings WHERE key = ?")
      .get("exit_grace_minutes");
    const parsed = Number(row?.value);
    return Number.isFinite(parsed) && parsed >= MIN_EXIT_GRACE_MINUTES
      ? parsed
      : DEFAULT_EXIT_GRACE_MINUTES;
  }

  static setExitGraceMinutes(minutes) {
    const parsed = Number(minutes);
    if (!Number.isInteger(parsed)) {
      throw new Error("exit_grace_minutes must be an integer");
    }
    if (
      parsed < MIN_EXIT_GRACE_MINUTES ||
      parsed > MAX_EXIT_GRACE_MINUTES
    ) {
      throw new Error(
        `exit_grace_minutes must be between ${MIN_EXIT_GRACE_MINUTES} and ${MAX_EXIT_GRACE_MINUTES}`,
      );
    }
    db.prepare(`
      INSERT INTO mvp_settings (key, value, updated_at)
      VALUES ('exit_grace_minutes', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `).run(String(parsed));
    return parsed;
  }

  static getAll() {
    const rows = db
      .prepare("SELECT key, value, updated_at FROM mvp_settings")
      .all();
    const settings = {};
    for (const row of rows) settings[row.key] = row.value;
    return settings;
  }
}

export default Setting;
