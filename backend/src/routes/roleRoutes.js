import express from "express";
import { getRoles } from "../controllers/RoleController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";

const router = express.Router();

router.use(authMiddleware, activityLogger);

router.get("/", getRoles);

export default router;
