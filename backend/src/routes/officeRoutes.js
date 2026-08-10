import express from "express";
import OfficeController from "../controllers/OfficeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.get("/", roleMiddleware(["admin", "staff"]), OfficeController.getAll);
router.get(
  "/staff/dashboard",
  roleMiddleware("staff"),
  OfficeController.getStaffOfficeDashboard,
);
router.patch("/:id/status", roleMiddleware(["admin", "staff"]), OfficeController.updateStatus);

router.put("/:id", roleMiddleware("admin"), OfficeController.updateOffice);

export default router;
