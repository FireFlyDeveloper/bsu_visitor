import express from "express";
import SecurityGuardController from "../controllers/SecurityGuardController.js";
import VisitLog from "../models/VisitLog.js";
import Visitor from "../models/Visitor.js";
import Office from "../models/Office.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.patch(
  "/office/:id/status",
  SecurityGuardController.updateOfficeStatus,
);

/**
 * GET /security-guard/visitors/active
 * Returns the list of visitors still inside the campus (time_out IS NULL).
 * Documented in doc/visit_logs.md — used by the security page.
 */
router.get("/visitors/active", (req, res) => {
  try {
    const rows = VisitLog.findActiveVisits();

    const enriched = rows.map((log) => {
      const visitor = Visitor.findById(log.visitor_id) || {};
      const office = Office.findById
        ? Office.findById(log.office_id)
        : null;
      return {
        log_id: log.id,
        visitor_id: log.visitor_id,
        visitor_name: visitor.fullname || null,
        contact_number: visitor.contact_number || null,
        office_id: log.office_id,
        office_name: office?.office_name || null,
        purpose: log.purpose,
        status: log.status,
        time_in: log.time_in,
        time_out: log.time_out,
      };
    });

    res.json({ total: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
