import db from "../database/database.js";
import VisitLog from "../models/VisitLog.js";
import Visitor from "../models/Visitor.js";
import { getOrCreateAccessToken, recordNotification } from "../models/Mvp.js";

/**
 * Public (no-auth) visitor self-registration endpoint.
 * Used when a visitor scans a fixed per-office QR code at the door
 * and registers themselves from their phone — no photo, no login.
 */
class PublicController {
  // GET /api/public/office/:id — returns the office so the visitor
  // self-registration page can show "You're visiting [Office Name]".
  static getOffice(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "invalid office id" });
      }
      const office = db
        .prepare(
          `SELECT id, office_name, status, type FROM offices WHERE id = ?`,
        )
        .get(id);
      if (!office) {
        return res.status(404).json({ error: "Office not found" });
      }
      return res.json(office);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/public/offices — public list of offices (no auth) for the
  // destination picker on the /office QR landing page.
  static listOffices(req, res) {
    try {
      const rows = db
        .prepare(
          `SELECT id, office_name, status, type
           FROM offices
           ORDER BY office_name`,
        )
        .all();
      return res.json({ offices: rows });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/public/office/:id/register
  // body: { fullname, contact_number, address, purpose }
  // Creates (or reuses) the visitor, then creates a pending visit_log.
  // Returns the visit_log id so the client can show a confirmation.
  static register(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "invalid office id" });
      }
      const office = db
        .prepare(`SELECT id, office_name FROM offices WHERE id = ?`)
        .get(id);
      if (!office) {
        return res.status(404).json({ error: "Office not found" });
      }

      const { fullname, contact_number, address, purpose = "" } = req.body || {};
      const normalizedContact = contact_number.trim();

      // Reuse the visitor by contact_number if they exist.
      let visitor = Visitor.findByContactNumber(normalizedContact);
      if (!visitor) {
        const newId = Visitor.create({
          fullname,
          contact_number: normalizedContact,
          address: address.trim(),
          id_type: "",
          img: null,
        });
        visitor = Visitor.findById(newId);
      }

      const pending = db.prepare(`
        SELECT id FROM visit_logs
        WHERE visitor_id = ? AND office_id = ? AND status IN ('pending', 'processing') AND left_at IS NULL
        LIMIT 1
      `).get(visitor.id, id);
      if (pending) {
        const access = getOrCreateAccessToken(pending.id);
        return res.status(200).json({ ok: true, idempotent: true, logId: pending.id, access_token: access.token, access_expires_at: access.expires_at, office: { id: office.id, office_name: office.office_name } });
      }

      const logId = VisitLog.create({
        visitor_id: visitor.id,
        office_id: id,
        purpose: purpose.trim(),
        logged_by: null,
        status: "pending",
      });
      recordNotification("office", id, "visitor_registered", { visit_id: logId });
      recordNotification("security", id, "visitor_registered", { visit_id: logId });

      // Build an absolute URL for the visitor's photo (if any) so the
      // client can <img src=...> it on the success screen.
      const visitorImg = visitor.img
        ? `${req.protocol}://${req.get("host")}/api/visitor-images/${visitor.img.split("/").pop()}`
        : null;

      const access = getOrCreateAccessToken(logId);
      return res.status(201).json({
        ok: true,
        logId,
        access_token: access.token,
        access_expires_at: access.expires_at,
        office: { id: office.id, office_name: office.office_name },
        visitor: {
          id: visitor.id,
          fullname: visitor.fullname,
          img: visitorImg,
        },
      });
    } catch (err) {
      console.error("public register error:", err);
      return res.status(500).json({ error: "Unable to register visitor" });
    }
  }
}

export default PublicController;
