import VisitorStatus from "../models/VisitorStatus.js";
import db from "../database/database.js";
import { pushToAudience, pushToVisit } from "../services/pushService.js";

const STATUS_TEXT = {
  processing: "Processing",
  completed: "Completed",
  rejected: "Not accepted",
};

/** Notify visitor + security (+ office staff) about a visit status change. */
async function notifyStatusChange(visitLogId, status) {
  const visit = db
    .prepare(
      `SELECT l.id, l.office_id, l.status, l.exit_deadline,
              v.fullname AS visitor_name, o.office_name
       FROM visit_logs l
       JOIN visitors v ON v.id = l.visitor_id
       JOIN offices o ON o.id = l.office_id
       WHERE l.id = ?`,
    )
    .get(visitLogId);
  if (!visit) return;
  const name = visit.visitor_name || "A visitor";

  if (status === "processing") {
    await Promise.all([
      // Visitor: their turn has come.
      pushToVisit(visitLogId, {
        title: "It's your turn",
        body: `${name}, ${visit.office_name} is now attending to you.`,
        tag: `visit-${visitLogId}`,
      }, { type: "status", status, visit_log_id: visitLogId }),
      // Staff of the office keep their queue awareness.
      pushToAudience("office", {
        officeId: visit.office_id,
        notification: { title: "Visitor called", body: `${name} is being processed at ${visit.office_name}.`, tag: `office-${visitLogId}` },
        data: { type: "status", status, visit_log_id: visitLogId },
      }),
    ]);
  }

  if (status === "completed") {
    const deadline = visit.exit_deadline
      ? ` by ${new Date(visit.exit_deadline.replace(" ", "T")).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
      : "";
    await Promise.all([
      // Visitor: visit finished — sign-out deadline applies.
      pushToVisit(visitLogId, {
        title: "Visit completed",
        body: `${name}, your visit at ${visit.office_name} is complete. Please sign out${deadline}.`,
        tag: `visit-${visitLogId}`,
      }, { type: "status", status, visit_log_id: visitLogId }),
      // Security: ready for sign-out.
      pushToAudience("security", {
        notification: { title: "Ready for sign-out", body: `${name} completed their visit at ${visit.office_name}${deadline}.`, tag: `signout-${visitLogId}` },
        data: { type: "ready_signout", status, visit_log_id: visitLogId },
      }),
    ]);
  }
}

class VisitorStatusController {
  /**
   * PATCH /visit-logs/:id/status
   * Update single visit log status
   */
  static updateStatus(req, res) {
    try {
      const visitLogId = req.params.id;
      const { status } = req.body;

      const updated = VisitorStatus.updateStatus({
        visitLogId,
        status,
      });

      if (!updated) {
        return res.status(404).json({
          message: "Visit log not found or not updated",
        });
      }

      // Fire-and-forget push notifications — never block the response.
      notifyStatusChange(Number(visitLogId), status).catch((err) =>
        console.error("push notify failed:", err.message),
      );

      return res.json({
        message: "Status updated successfully",
      });
    } catch (err) {
      return res.status(400).json({
        message: err.message,
      });
    }
  }

  /**
   * PATCH /visit-logs/office/:officeId/status
   * Bulk update by office (optionally filtered by currentStatus)
   */
  static updateStatusByOffice(req, res) {
    try {
      const officeId = req.params.officeId;
      const { status, currentStatus } = req.body;

      const changes = VisitorStatus.updateStatusByOffice({
        officeId,
        status,
        currentStatus,
      });

      return res.json({
        message: "Bulk status update completed",
        updatedRows: changes,
      });
    } catch (err) {
      return res.status(400).json({
        message: err.message,
      });
    }
  }

  /**
   * GET /visit-logs/status/:status
   * Get logs by status (with optional office filtering)
   */
  static findByStatus(req, res) {
    try {
      const { status } = req.params;
       const userId = req.user?.id; // from authMiddleware

      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      let result;

      // If user is tied to office → filter by office
       if (req.user.role === "admin") {
         result = VisitorStatus.findByStatus({ status, limit, offset });
       } else if (userId) {
        result = VisitorStatus.findByStatusAndOffice({
          userId,
          status,
          limit,
          offset,
        });
      } else {
        // fallback (admin/global)
        result = VisitorStatus.findByStatus({
          status,
          limit,
          offset,
        });
      }

      return res.json(result);
    } catch (err) {
      return res.status(400).json({
        message: err.message,
      });
    }
  }
  /**
   * GET /visit-logs/office/:officeId/status-count
   * Get status breakdown per office
   */
  static countByOffice(req, res) {
    try {
      const officeId = req.params.officeId;

       const result = VisitorStatus.countByOffice({ officeId });

      return res.json(result);
    } catch (err) {
      return res.status(400).json({
        message: err.message,
      });
    }
  }
}

export default VisitorStatusController;
