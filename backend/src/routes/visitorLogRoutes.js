import express from "express";
import VisitorLogController from "../controllers/VisitorLogController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { activityLogger } from "../middleware/activityLogger.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.get("/", VisitorLogController.getAll);
// Static route must be declared BEFORE the `/:id` parameter route.
router.get(
  "/overdue",
  roleMiddleware(["admin", "security", "staff"]),
  VisitorLogController.listOverdue,
);
router.get(
  "/pending",
  VisitorLogController.getPendingByUserOffice,
);
router.get("/counts", VisitorLogController.countPerOffice);
router.get("/:id", VisitorLogController.getById);
router.post(
  "/register",
  upload.single("img"),
  VisitorLogController.register,
);
router.post("/", VisitorLogController.create);
router.put("/:id", VisitorLogController.update);
router.patch(
  "/:id/done",
  roleMiddleware(["staff", "admin"]),
  VisitorLogController.markDone,
);
router.delete("/:id", VisitorLogController.delete);

export default router;
