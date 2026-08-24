import webpush from "web-push";
import db from "../database/database.js";
import { isWebPushConfigured } from "../models/Mvp.js";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

/** Send to every subscription matching the audience (optionally one office). */
export async function pushToAudience(audience, { officeId = null, notification = {}, data = {} } = {}) {
  if (!ensureConfigured()) {
    return { sent: 0, reason: "vapid_not_configured" };
  }
  let subs;
  if (officeId != null && audience === "office") {
    // Staff of a specific office: subscriptions saved with that office's user ids.
    subs = db.prepare(`
      SELECT ps.id, ps.subscription_json
      FROM push_subscriptions ps
      JOIN users u ON u.id = ps.user_id
      WHERE ps.audience = 'office' AND u.office_id = ?`).all(officeId);
  } else {
    subs = db.prepare(`SELECT id, subscription_json FROM push_subscriptions WHERE audience = ?`)
      .all(audience);
  }

  const payload = JSON.stringify({ notification, data });
  let sent = 0;
  const errors = [];
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(JSON.parse(sub.subscription_json), payload);
      sent += 1;
    } catch (err) {
      errors.push(`${err?.statusCode ?? "net"}:${err?.message?.slice(0, 60)}`);
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        // Subscription expired — drop it.
        db.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).run(sub.id);
      }
    }
  }));
  if (errors.length) {
    console.error(`push to ${audience}: sent=${sent} failed=${errors.join("; ")}`);
  }
  return { sent };
}

/**
 * Visitor-facing push. Visitor tokens live in visitor_access_tokens; we store
 * visitor subscriptions keyed by visit_log_id so any device holding the token
 * cookie can subscribe.
 */
export async function pushToVisit(visitLogId, notification, data = {}) {
  if (!ensureConfigured()) return { sent: 0, reason: "vapid_not_configured" };
  const subs = db.prepare(
    `SELECT id, subscription_json FROM push_subscriptions WHERE audience = 'visitor' AND visit_log_id = ?`,
  ).all(visitLogId);
  const payload = JSON.stringify({ notification, data });
  let sent = 0;
  const errors = [];
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(JSON.parse(sub.subscription_json), payload);
      sent += 1;
    } catch (err) {
      errors.push(`${err?.statusCode ?? "net"}:${err?.message?.slice(0, 60)}`);
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        db.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).run(sub.id);
      }
    }
  }));
  if (errors.length) {
    console.error(`push to visit ${visitLogId}: sent=${sent} failed=${errors.join("; ")}`);
  }
  return { sent };
}
