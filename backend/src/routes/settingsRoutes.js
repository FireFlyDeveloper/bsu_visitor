import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import Setting from "../models/Setting.js";

const router = express.Router();

// System settings are admin-only configuration, including the authoritative
// global exit grace period used to compute every visit's exit_deadline.
router.use(authMiddleware, roleMiddleware("admin"));

router.get("/", (req, res) => {
  try {
    return res.json({
      settings: {
        exit_grace_minutes: Setting.getExitGraceMinutes(),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch("/", (req, res) => {
  try {
    const { exit_grace_minutes } = req.body || {};
    const updated = Setting.setExitGraceMinutes(exit_grace_minutes);
    return res.json({
      settings: { exit_grace_minutes: updated },
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
