import db from "../database/database.js";
import crypto from "node:crypto";
import VisitLog from "../models/VisitLog.js";
import { createAccessToken, findVisitByAccessToken, getExitGraceMinutes, isWebPushConfigured, savePushSubscription, setExitGraceMinutes } from "../models/Mvp.js";

export default class MvpController {
  static accessStatus(req, res) {
    const visit = findVisitByAccessToken(req.params.token);
    if (!visit || visit.revoked_at || new Date(visit.expires_at) <= new Date()) return res.status(404).json({ error: "Access link is invalid or expired" });
    return res.json({ visit: { id: visit.id, office: visit.office_name, status: visit.status, time_in: visit.time_in, time_out: visit.time_out, left_at: visit.left_at, exit_deadline: visit.exit_deadline, overdue: Boolean(visit.exit_deadline && new Date(visit.exit_deadline) <= new Date() && !visit.left_at) } });
  }

  static settings(req, res) {
    if (req.method === "GET") return res.json({ exit_grace_minutes: getExitGraceMinutes(), push: { configured: isWebPushConfigured(), reason: isWebPushConfigured() ? null : "Web Push VAPID delivery is not configured on this deployment" } });
    const minutes = Number(req.body?.exit_grace_minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) return res.status(400).json({ error: "exit_grace_minutes must be an integer from 1 to 1440" });
    setExitGraceMinutes(minutes);
    return res.json({ exit_grace_minutes: minutes });
  }

  static subscribe(req, res) {
    try {
      const audience = ["office", "security"].includes(req.body?.audience) ? req.body.audience : "security";
      savePushSubscription({ userId: req.user.id, audience, subscription: req.body?.subscription });
      return res.status(201).json({ ok: true, delivery: isWebPushConfigured() ? "configured" : "not_configured", message: isWebPushConfigured() ? "Subscription saved for configured delivery" : "Subscription saved; in-app updates remain available until VAPID is configured" });
    } catch (error) { return res.status(400).json({ error: error.message }); }
  }

  /** Visitor opt-in: the opaque token is hashed against visit_logs columns. */
  static subscribeVisitor(req, res) {
    try {
      const { token, subscription } = req.body || {};
      if (typeof token !== "string" || token.length < 16 || token.length > 128) {
        return res.status(404).json({ error: "Visit not found" });
      }
      const visit = VisitLog.findByAccessTokenHash(
        crypto.createHash("sha256").update(token).digest("hex"),
      );
      if (!visit) return res.status(404).json({ error: "Visit not found" });
      savePushSubscription({
        audience: "visitor",
        subscription,
        visitLogId: visit.id,
      });
      return res.status(201).json({ ok: true, delivery: isWebPushConfigured() ? "configured" : "not_configured" });
    } catch (error) { return res.status(400).json({ error: error.message }); }
  }

  static vapidPublicKey(_req, res) {
    return res.json({ public_key: process.env.VAPID_PUBLIC_KEY || null });
  }

  static events(req, res) {
    const rows = db.prepare(`SELECT id, audience, office_id, event_type, payload_json, created_at FROM notification_events WHERE (audience = 'security' OR (audience = 'office' AND office_id = (SELECT office_id FROM users WHERE id = ?))) ORDER BY id DESC LIMIT 50`).all(req.user.id);
    return res.json({ configured: isWebPushConfigured(), events: rows.map((row) => ({ ...row, payload: JSON.parse(row.payload_json) })) });
  }

  static issueToken(visitLogId) { return createAccessToken(visitLogId); }
}
