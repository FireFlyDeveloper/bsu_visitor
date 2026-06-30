import express from "express";
import UserController from "../controllers/UserController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";

const router = express.Router();

// Public routes
router.post("/login", UserController.login);
router.post("/logout", UserController.logout);

// Protected routes — any authenticated user can read their own data
router.use(authMiddleware, activityLogger);
router.get("/me", UserController.getCurrentUser);
router.get("/all-with-activity", UserController.getAllWithLastActivity);

// Admin-only: user management
router.get("/", roleMiddleware("admin"), UserController.getAll);
router.get("/:id", roleMiddleware("admin"), UserController.getById);
router.post("/", roleMiddleware("admin"), UserController.create);
router.put("/:id", roleMiddleware("admin"), UserController.update);
router.delete("/:id", roleMiddleware("admin"), UserController.delete);

export default router;
