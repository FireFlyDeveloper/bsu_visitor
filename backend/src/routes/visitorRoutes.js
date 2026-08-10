import express from "express";
import VisitorController from "../controllers/VisitorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { activityLogger } from "../middleware/activityLogger.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { persistImage } from "../middleware/upload.js";

const router = express.Router();

router.use(authMiddleware, activityLogger, roleMiddleware("admin"));

router.post(
  "/",
  upload.single("img"),
  persistImage,
  VisitorController.create,
);
router.get("/", VisitorController.getAll);
router.get("/:id", VisitorController.getById);
router.put("/:id", VisitorController.update);
router.delete("/:id", VisitorController.delete);

export default router;
