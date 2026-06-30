import VisitLog from "../models/VisitLog.js";

class GuardSignOutController {
  static signOut(req, res) {
    try {
      const { id } = req.params;
      const log = VisitLog.findById(id);
      if (!log) {
        return res.status(404).json({ error: "Visit log not found" });
      }
      if (log.status !== "completed") {
        return res.status(409).json({
          error: "Cannot sign out: office has not marked this visit done",
        });
      }
      if (log.left_at) {
        return res.status(409).json({ error: "Visit already signed out" });
      }
      const ok = VisitLog.markLeft(id);
      if (!ok) {
        return res
          .status(500)
          .json({ error: "Failed to record sign-out" });
      }
      return res.json({
        message: "Visitor signed out",
        log: VisitLog.findById(id),
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export default GuardSignOutController;
