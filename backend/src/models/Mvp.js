import crypto from "node:crypto";
import db from "../database/database.js";

const TOKEN_TTL_DAYS = 7;

export function hashAccessToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createAccessToken(visitLogId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TOKEN_TTL_DAYS * 86400000).toISOString();
  db.prepare(`INSERT INTO visitor_access_tokens (visit_log_id, token_hash, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(visit_log_id) DO UPDATE SET token_hash=excluded.token_hash,
    expires_at=excluded.expires_at, revoked_at=NULL`).run(visitLogId, hashAccessToken(token), expires);
  return { token, expires_at: expires };
}

export function getOrCreateAccessToken(visitLogId) {
  return createAccessToken(visitLogId);
}

export function findVisitByAccessToken(token) {
  return db.prepare(`SELECT t.expires_at, t.revoked_at, l.id, l.office_id, l.status,
    l.time_in, l.time_out, l.left_at, l.exit_deadline, o.office_name
    FROM visitor_access_tokens t JOIN visit_logs l ON l.id = t.visit_log_id
    JOIN offices o ON o.id = l.office_id
    WHERE t.token_hash = ?`).get(hashAccessToken(token));
}

export function getExitGraceMinutes() {
  return Number(db.prepare(`SELECT setting_value FROM system_settings WHERE setting_key = 'exit_grace_minutes'`).get()?.setting_value || 30);
}

export function setExitGraceMinutes(minutes) {
  db.prepare(`UPDATE system_settings SET setting_value = ? WHERE setting_key = 'exit_grace_minutes'`).run(String(minutes));
}

export function recordNotification(audience, officeId, eventType, payload, dedupKey = null) {
  try {
    // INSERT OR IGNORE works with the partial unique index used for nullable
    // dedup keys, unlike ON CONFLICT(dedup_key), which SQLite cannot resolve
    // against that index.
    db.prepare(`INSERT OR IGNORE INTO notification_events
      (audience, office_id, event_type, payload_json, dedup_key)
      VALUES (?, ?, ?, ?, ?)`).run(audience, officeId || null, eventType, JSON.stringify(payload), dedupKey);
  } catch (err) {
    // Registration must remain available for databases from before the MVP
    // migration, or when notification persistence is otherwise unavailable.
    try {
      db.prepare(`INSERT INTO notification_events
        (audience, office_id, event_type, payload_json)
        VALUES (?, ?, ?, ?)`).run(audience, officeId || null, eventType, JSON.stringify(payload));
    } catch (fallbackError) {
      console.error("notification persistence unavailable:", fallbackError.message);
    }
  }
}

export function isWebPushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

export function savePushSubscription({ userId, audience, subscription }) {
  const endpoint = subscription?.endpoint;
  if (!endpoint || typeof endpoint !== "string" || endpoint.length > 2048) throw new Error("A valid push endpoint is required");
  db.prepare(`INSERT INTO push_subscriptions (user_id, audience, endpoint, subscription_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, audience=excluded.audience,
    subscription_json=excluded.subscription_json, last_seen_at=CURRENT_TIMESTAMP`)
    .run(userId || null, audience, endpoint, JSON.stringify(subscription));
}
