import Visitor from "../models/Visitor.js";
import VisitorLink from "../models/VisitorLink.js";
import VisitLog from "../models/VisitLog.js";

class VisitorLogController {
  static register(req, res) {
    try {
      const {
        visitor_id,
        fullname,
        contact_number,
        address,
        id_type,
        office_id,
        purpose,
      } = req.body;

      if (!office_id) {
        return res.status(400).json({ error: "office_id is required" });
      }

      const parsedOfficeId = Number(office_id);

      let img = null;
      if (req.file) {
        img = `uploads/${req.file.filename}`;
      }

      let visitor = null;

      if (visitor_id) {
        visitor = Visitor.findById(visitor_id);
      }

      if (!visitor && contact_number) {
        visitor = Visitor.findByContactNumber(contact_number);
      }

      if (!visitor && fullname) {
        visitor = Visitor.findByFullname(fullname);
      }

      if (!visitor) {
        if (!fullname || !contact_number || !address) {
          return res.status(400).json({
            error:
              "fullname, contact_number, and address are required for a new visitor",
          });
        }

        const newVisitorId = Visitor.create({
          fullname,
          contact_number,
          address,
          id_type,
          img,
        });

        visitor = Visitor.findById(newVisitorId);
      }

      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }

      const logId = VisitLog.create({
        visitor_id: visitor.id,
        office_id: parsedOfficeId,
        purpose,
        logged_by: req.user?.id || null,
      });

      const token = VisitorLink.create(visitor.id, parsedOfficeId);

      const origin =
        process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;

      const link = `${origin}/visitor-access/${token}`;

      const baseUrl = `${req.protocol}://${req.get("host")}`;

      if (visitor.img) {
        visitor.img = `${baseUrl}/${visitor.img}`;
      }

      return res.status(201).json({
        visitor,
        logId,
        link,
        expires_in_seconds: 3600,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static countPerOffice(req, res) {
    try {
      const data = VisitLog.countPerOffice();

      return res.json({
        message: "Count per office fetched successfully",
        data,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  static create(req, res) {
    try {
      const { visitor_id, office_id, purpose } = req.body;
      const logged_by = req.user?.id || req.body.logged_by || null;

      if (!visitor_id || !office_id) {
        return res
          .status(400)
          .json({ error: "visitor_id and office_id are required" });
      }

      const logId = VisitLog.create({
        visitor_id,
        office_id,
        purpose,
        logged_by,
      });

      res
        .status(201)
        .json({ message: "Visitor log created successfully", logId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // This method is for admin users to view all logs with optional filters and pagination
  static getAll(req, res) {
    try {
      const {
        visitor_name,
        start_date,
        end_date,
        page = 1,
        per_page = 20,
      } = req.query;

      const pageNumber = Number(page) || 1;
      const perPage = Number(per_page) || 20;
      const offset = (pageNumber - 1) * perPage;

      const { rows, total } = VisitLog.findLogs({
        visitorName: visitor_name,
        startDate: start_date,
        endDate: end_date,
        limit: perPage,
        offset,
      });

      return res.json({
        logs: rows,
        total,
        page: pageNumber,
        per_page: perPage,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  //not used
  static getById(req, res) {
    try {
      const { id } = req.params;
      const log = VisitLog.findById(id);

      if (!log) {
        return res.status(404).json({ error: "Visitor log not found" });
      }

      res.json(log);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  //not used
  static update(req, res) {
    try {
      const { id } = req.params;
      const { visitor_id, office_id, purpose, time_out } = req.body;

      const log = VisitLog.findById(id);
      if (!log) {
        return res.status(404).json({ error: "Visitor log not found" });
      }

      const success = VisitLog.update(id, {
        visitor_id: visitor_id || log.visitor_id,
        office_id: office_id || log.office_id,
        purpose: purpose !== undefined ? purpose : log.purpose,
        logged_by: log.logged_by,
      });

      if (!success) {
        return res.status(400).json({ error: "Unable to update visitor log" });
      }

      if (time_out !== undefined) {
        VisitLog.updateTimeOut(id, time_out);
      }

      res.json({ message: "Visitor log updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // This method is for staff users to view pending visits related to their assigned offices with pagination
  static getPendingByUserOffice(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized: user not found",
        });
      }

      const { limit = 20, offset = 0 } = req.query;

      const result = VisitLog.findPendingByUserOffice({
        userId,
        limit: Number(limit),
        offset: Number(offset),
      });

      return res.json({
        success: true,
        data: result.rows,
        total: result.total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (err) {
      console.error("getPendingByUserOffice error:", err);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  static delete(req, res) {
    try {
      const { id } = req.params;
      const log = VisitLog.findById(id);

      if (!log) {
        return res.status(404).json({ error: "Visitor log not found" });
      }

      const success = VisitLog.delete(id);
      if (!success) {
        return res.status(400).json({ error: "Unable to delete visitor log" });
      }

      res.json({ message: "Visitor log deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default VisitorLogController;
