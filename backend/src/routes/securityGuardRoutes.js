import express from "express";
import SecurityGuardController from "../controllers/SecurityGuardController.js";
import KioskController from "../controllers/KioskController.js";
import GuardSignOutController from "../controllers/GuardSignOutController.js";
import VisitLog from "../models/VisitLog.js";
import Visitor from "../models/Visitor.js";
import Office from "../models/Office.js";
import upload from "../middleware/upload.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";
import { persistImage } from "../middleware/upload.js";

const router = express.Router();

function absoluteUrl(req, relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  return `${req.protocol}://${req.get("host")}/${relativePath}`;
}

router.use(authMiddleware, activityLogger);

// Guard kiosk — register a visitor at the school entrance.
// Photo is required.
router.post(
  "/kiosk/register",
  roleMiddleware("security"),
  upload.single("img"),
  persistImage,
  KioskController.register,
);

// Guard sign-out — when the visitor physically leaves the guard house.
router.patch(
  "/visit-logs/:id/sign-out",
  roleMiddleware("security"),
  GuardSignOutController.signOut,
);

// Security-only routes
router.patch(
  "/office/:id/status",
  roleMiddleware("security"),
  SecurityGuardController.updateOfficeStatus,
);

/**
 * GET /security-guard/visitors/active
 * Returns visitors whose visit is completed but who have not signed out.
 */
router.get(
  "/visitors/active",
  roleMiddleware("security"),
  (req, res) => {
    try {
      const rows = VisitLog.findActiveVisits();

      const enriched = rows.map((log) => {
        const visitor = Visitor.findById(log.visitor_id) || {};
        const office = Office.findById(log.office_id);
        return {
          id: log.id,
          log_id: log.id,
          visitor_id: log.visitor_id,
          visitor_name: visitor.fullname || null,
          contact_number: visitor.contact_number || null,
          visitor_img: (log.visitor_img || visitor.img)
            ? `${req.protocol}://${req.get("host")}/api/visitor-images/${(log.visitor_img || visitor.img).split("/").pop()}`
            : null,
          office_id: log.office_id,
          office_name: office?.office_name || null,
          purpose: log.purpose,
          status: log.status,
          time_in: log.time_in,
          time_out: log.time_out,
          left_at: log.left_at,
        };
      });

      res.json({ total: enriched.length, data: enriched });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);
router.get("/visitors/pending-sign-out", roleMiddleware("security"), SecurityGuardController.pendingSignOut);
router.patch("/visitors/:visitId/overdue-acknowledgement", roleMiddleware("security"), SecurityGuardController.acknowledgeOverdue);

export default router;
