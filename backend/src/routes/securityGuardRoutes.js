import express from "express";
import SecurityGuardController from "../controllers/SecurityGuardController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.patch(
  "/office/:id/status",
  SecurityGuardController.updateOfficeStatus,
);

export default router;
