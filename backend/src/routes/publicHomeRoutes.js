import { Router } from "express";
import VisitLog from "../models/VisitLog.js";
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


router.get("/offices", (req, res) => {
  try {
    const rows = Office.findAll();
    return res.json({ offices: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/visitors/active", (req, res) => {
  try {
    const data = VisitLog.findActiveVisits().reduce((summary, log) => {
      const key = String(log.office_id);
      const current = summary.get(key) || { office_id: log.office_id, total: 0 };
      current.total += 1;
      summary.set(key, current);
      return summary;
    }, new Map());
    const offices = [...data.values()].map((item) => ({
      ...item,
      office_name: Office.findById(item.office_id)?.office_name || null,
    }));
    return res.json({ total: offices.reduce((n, item) => n + item.total, 0), offices });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
