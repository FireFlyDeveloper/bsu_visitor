import express from "express";
import VisitorStatusController from "../controllers/VisitorStatusController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.patch(
  "/:id/status",
  VisitorStatusController.updateStatus,
);

router.patch(
  "/office/:officeId/status",
  VisitorStatusController.updateStatusByOffice,
);

router.get(
  "/status/:status",
  VisitorStatusController.findByStatus,
);

router.get(
  "/office/:officeId/status-count",
  VisitorStatusController.countByOffice,
);

export default router;
