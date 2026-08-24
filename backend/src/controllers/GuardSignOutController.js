import VisitLog from "../models/VisitLog.js";
import db from "../database/database.js";
import { pushToVisit } from "../services/pushService.js";

function getVisitorNameAndOffice(visitLogId) {
  const row = db
    .prepare(
      `SELECT v.fullname AS visitor_name, o.office_name
       FROM visit_logs l
       JOIN visitors v ON v.id = l.visitor_id
       JOIN offices o ON o.id = l.office_id
       WHERE l.id = ?`,
    )
    .get(visitLogId);
  return Promise.resolve({
    visitorName: row?.visitor_name || "A visitor",
    officeName: row?.office_name || "the office",
  });
}

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

      // Fire-and-forget: confirm the sign-out to the visitor's device.
      const signedOut = VisitLog.findById(id);
      getVisitorNameAndOffice(id)
        .then(({ visitorName, officeName }) =>
          pushToVisit(id, {
            title: "Signed out — safe travels!",
            body: `${visitorName}, you have been signed out of ${officeName}. Thank you for visiting.`,
            tag: `signed-out-${id}`,
          }, { type: "signed_out", visit_log_id: id }),
        )
        .catch((err) => console.error("push notify failed:", err.message));

      return res.json({
        message: "Visitor signed out",
        log: signedOut,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export default GuardSignOutController;
