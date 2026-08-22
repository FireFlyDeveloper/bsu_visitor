import express from "express";
import VisitorLogController from "../controllers/VisitorLogController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { activityLogger } from "../middleware/activityLogger.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { assignedOfficeOnly, visitOfficeOnly } from "../middleware/officeAccess.js";
import { persistImage } from "../middleware/upload.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.get("/", roleMiddleware(["admin", "staff"]), VisitorLogController.getAll);
// Static route must be declared BEFORE the `/:id` parameter route.
router.get(
  "/overdue",
  roleMiddleware(["admin", "security", "staff"]),
  VisitorLogController.listOverdue,
);
router.get(
  "/pending",
  roleMiddleware("staff"),
  VisitorLogController.getPendingByUserOffice,
);
router.get("/counts", roleMiddleware(["admin", "staff"]), VisitorLogController.countPerOffice);
router.get("/:id", roleMiddleware(["admin", "staff"]), visitOfficeOnly, VisitorLogController.getById);
router.post(
  "/register",
  upload.single("img"),
  persistImage,
  VisitorLogController.register,
);
router.post("/", roleMiddleware(["admin", "staff"]), assignedOfficeOnly, VisitorLogController.create);
router.put("/:id", roleMiddleware("admin"), VisitorLogController.update);
router.patch(
  "/:id/done",
  roleMiddleware(["staff", "admin"]),
  visitOfficeOnly,
  VisitorLogController.markDone,
);
router.delete("/:id", roleMiddleware("admin"), VisitorLogController.delete);

export default router;
