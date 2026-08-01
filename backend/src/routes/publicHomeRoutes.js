import { Router } from "express";
import db from "../database/database.js";
import VisitLog from "../models/VisitLog.js";
import Visitor from "../models/Visitor.js";
import Office from "../models/Office.js";

/**
 * Public "browse" endpoints. No auth.
 *
 * These power the unauthenticated home page experience:
 *   GET /api/public-home/offices           — office list (AR picker, home page)
 *   GET /api/public-home/visitors/active   — live "who's inside" widget
 *
 * Mounted at /api/public-home in server.js. Kept separate from publicRoutes.js
 * (which is the per-office fixed-QR self-registration flow) so the two scopes
 * stay independent.
 */
const router = Router();

function absoluteUrl(req, relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  return `${req.protocol}://${req.get("host")}/${relativePath}`;
}

router.get("/offices", (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT id, office_name, status, type, latitude, longitude
         FROM offices
         ORDER BY office_name`,
      )
      .all();
    return res.json({ offices: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/visitors/active", (req, res) => {
  try {
    const rows = VisitLog.findActiveVisits();
    const data = rows.map((log) => {
      const visitor = Visitor.findById(log.visitor_id) || {};
      const office = Office.findById(log.office_id);
      return {
        id: log.id,
        log_id: log.id,
        visitor_id: log.visitor_id,
        visitor_name: visitor.fullname || null,
        contact_number: visitor.contact_number || null,
        visitor_img: absoluteUrl(req, log.visitor_img || visitor.img || null),
        office_id: log.office_id,
        office_name: office?.office_name || null,
        purpose: log.purpose,
        status: log.status,
        time_in: log.time_in,
        time_out: log.time_out,
        left_at: log.left_at,
      };
    });
    return res.json({ total: data.length, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
