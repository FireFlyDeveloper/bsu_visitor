import { Router } from "express";
import PublicController from "../controllers/PublicController.js";
import { publicRegistrationGuard, validatePublicRegistration } from "../middleware/publicRegistration.js";

const router = Router();

// Public (no-auth) endpoints used by the per-office fixed-QR flow.
// Visitors scan the QR stuck on the office door and self-register
// from their phone — no login, no photo required.
router.get("/offices", PublicController.listOffices);
router.get("/directory", PublicController.directory);
router.get("/status/:token", PublicController.status);
router.get("/office/:id", PublicController.getOffice);
router.post("/office/:id/register", publicRegistrationGuard, validatePublicRegistration, PublicController.register);
router.post("/register", publicRegistrationGuard, validatePublicRegistration, PublicController.registerGeneral);

export default router;
