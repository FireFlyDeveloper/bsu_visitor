import Office from "../models/Office.js";
import User from "../models/User.js";

const ALLOWED_STATUSES = new Set(["available", "busy", "not available"]);

class OfficeController {
  static getAll(req, res) {
    try {
      const offices = Office.findAll();
      res.json(offices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static getStaffOfficeDashboard(req, res) {
    try {
      const user = User.findById(req.user.id);

      if (!user?.office_id) {
        return res
          .status(404)
          .json({ error: "No office assigned to this staff account" });
      }

      const office = Office.findDashboardById(user.office_id);

      if (!office) {
        return res.status(404).json({ error: "Office not found" });
      }

      res.json(office);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static updateStatus(req, res) {
    try {
      const user = User.findById(req.user.id);
      const officeId = Number(req.params.id);
      const { status } = req.body;

      if (!ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({ error: "Invalid office status" });
      }

      if (!user?.office_id) {
        return res
          .status(403)
          .json({ error: "No office assigned to this staff account" });
      }

      if (Number(user.office_id) !== officeId && Number(user.role_id) !== 1) {
        return res
          .status(403)
          .json({ error: "You can only update your assigned office" });
      }

      const office = Office.findById(officeId);
      if (!office) {
        return res.status(404).json({ error: "Office not found" });
      }

      const success = Office.updateStatus(officeId, status);
      if (!success) {
        return res
          .status(400)
          .json({ error: "Unable to update office status" });
      }

      res.json(Office.findDashboardById(officeId));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static updateOffice(req, res) {
    try {
      const user = User.findById(req.user.id);
      const officeId = Number(req.params.id);

      const { office_name, latitude, longitude, type, status } = req.body;

      // basic validation
      if (!office_name || !latitude || !longitude || !type || !status) {
        return res.status(400).json({
          error:
            "All fields (office_name, latitude, longitude, type, status) are required",
        });
      }

      if (!ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({ error: "Invalid office status" });
      }

      // only allow owner office OR admin (role_id === 1)
      if (Number(user.office_id) !== officeId && Number(user.role_id) !== 1) {
        return res
          .status(403)
          .json({ error: "You can only update your assigned office" });
      }

      const office = Office.findById(officeId);
      if (!office) {
        return res.status(404).json({ error: "Office not found" });
      }

      const success = Office.update(officeId, {
        office_name,
        latitude,
        longitude,
        type,
        status,
      });

      if (!success) {
        return res.status(400).json({ error: "Unable to update office" });
      }

      // return updated dashboard data (same pattern as updateStatus)
      res.json(Office.findDashboardById(officeId));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default OfficeController;
