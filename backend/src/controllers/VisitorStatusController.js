import VisitorStatus from "../models/VisitorStatus.js";

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
      if (userId) {
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
