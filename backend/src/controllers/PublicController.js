import db from "../database/database.js";
import VisitLog from "../models/VisitLog.js";
import Visitor from "../models/Visitor.js";

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

      const { fullname, contact_number, address, purpose } = req.body || {};
      if (!fullname || !contact_number || !address) {
        return res.status(400).json({
          error: "fullname, contact_number, and address are required",
        });
      }

      // Reuse the visitor by contact_number if they exist.
      let visitor = Visitor.findByContactNumber(contact_number);
      if (!visitor) {
        const newId = Visitor.create({
          fullname,
          contact_number,
          address,
          id_type: "",
          img: null,
        });
        visitor = Visitor.findById(newId);
      }

      const logId = VisitLog.create({
        visitor_id: visitor.id,
        office_id: id,
        purpose: purpose || "",
        logged_by: null,
        status: "pending",
      });

      return res.status(201).json({
        ok: true,
        logId,
        office: { id: office.id, office_name: office.office_name },
        visitor: {
          id: visitor.id,
          fullname: visitor.fullname,
        },
      });
    } catch (err) {
      console.error("public register error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
}

export default PublicController;
