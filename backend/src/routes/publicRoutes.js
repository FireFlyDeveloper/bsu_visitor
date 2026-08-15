import { Router } from "express";
import PublicController from "../controllers/PublicController.js";

const router = Router();

/**
 * Minimal in-memory rate limiter for the public registration endpoints
 * (abuse guard without adding a dependency). Limits per client IP within
 * a rolling window. Do NOT put the status/office reads behind this.
 */
const REGISTER_LIMIT = 10;
const REGISTER_WINDOW_MS = 60_000;
const attempts = new Map();

function registerRateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const window = (attempts.get(ip) || []).filter((t) => now - t < REGISTER_WINDOW_MS);
  if (window.length >= REGISTER_LIMIT) {
    return res.status(429).json({ error: "Too many registration attempts. Please try again later." });
  }
  window.push(now);
  attempts.set(ip, window);
  next();
}

// Public (no-auth) endpoints used by the per-office fixed-QR flow.
// Visitors scan the QR stuck on the office door and self-register
// from their phone — no login, no photo required.
router.get("/offices", PublicController.listOffices);
router.get("/directory", PublicController.directory);
router.get("/office/:id", PublicController.getOffice);
router.post("/office/:id/register", registerRateLimit, PublicController.register);
router.post("/register", registerRateLimit, PublicController.register);
router.get("/status/:token", PublicController.status);

export default router;
