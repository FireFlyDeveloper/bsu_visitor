import { Router } from "express";
import PublicController from "../controllers/PublicController.js";

const router = Router();

// Public (no-auth) endpoints used by the per-office fixed-QR flow.
// Visitors scan the QR stuck on the office door and self-register
// from their phone — no login, no photo required.
router.get("/office/:id", PublicController.getOffice);
router.post("/office/:id/register", PublicController.register);

export default router;
