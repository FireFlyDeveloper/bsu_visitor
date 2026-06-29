import express from "express";
import OfficeController from "../controllers/OfficeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.get("/", OfficeController.getAll);
router.get(
  "/staff/dashboard",
  OfficeController.getStaffOfficeDashboard,
);
router.patch("/:id/status", OfficeController.updateStatus);

router.put("/:id", OfficeController.updateOffice);

export default router;
