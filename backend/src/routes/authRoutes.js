import express from "express";
import UserController from "../controllers/UserController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { activityLogger } from "../middleware/activityLogger.js";

const router = express.Router();

// Public routes
router.post("/login", UserController.login);
router.post("/logout", UserController.logout);

// Protected routes
router.use(authMiddleware, activityLogger);

router.get("/me", UserController.getCurrentUser);
router.get("/all-with-activity", UserController.getAllWithLastActivity);
router.get("/", UserController.getAll);
router.get("/:id", UserController.getById);
router.post("/", UserController.create);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.delete);

export default router;
