import { Router } from "express";
import MvpController from "../controllers/MvpController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = Router();
router.get("/visits/:token", MvpController.accessStatus);
router.get("/settings", authMiddleware, roleMiddleware(["admin"]), MvpController.settings);
router.patch("/settings", authMiddleware, roleMiddleware(["admin"]), MvpController.settings);
router.post("/push-subscriptions", authMiddleware, roleMiddleware(["admin", "staff", "security"]), MvpController.subscribe);
// Visitor opt-in (no login — the opaque token IS the credential).
router.post("/push-subscriptions/visitor", MvpController.subscribeVisitor);
router.get("/vapid-public-key", MvpController.vapidPublicKey);
router.get("/notification-events", authMiddleware, roleMiddleware(["admin", "staff", "security"]), MvpController.events);
export default router;
