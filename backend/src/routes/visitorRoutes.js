import express from "express";
import VisitorController from "../controllers/VisitorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { activityLogger } from "../middleware/activityLogger.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.post(
  "/",
  upload.single("img"),
  VisitorController.create,
);
router.get("/", VisitorController.getAll);
router.get("/:id", VisitorController.getById);
router.put("/:id", VisitorController.update);
router.delete("/:id", VisitorController.delete);

export default router;
