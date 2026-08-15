import express from "express";
import VisitorStatusController from "../controllers/VisitorStatusController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { assignedOfficeOnly, visitOfficeOnly } from "../middleware/officeAccess.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.patch(
  "/:id/status",
  roleMiddleware(["admin", "staff"]),
  visitOfficeOnly,
  VisitorStatusController.updateStatus,
);

router.patch(
  "/office/:officeId/status",
  roleMiddleware(["admin", "staff"]),
  assignedOfficeOnly,
  VisitorStatusController.updateStatusByOffice,
);

router.get(
  "/status/:status",
  roleMiddleware(["admin", "staff"]),
  VisitorStatusController.findByStatus,
);

router.get(
  "/office/:officeId/status-count",
  roleMiddleware(["admin", "staff"]),
  assignedOfficeOnly,
  VisitorStatusController.countByOffice,
);

export default router;
