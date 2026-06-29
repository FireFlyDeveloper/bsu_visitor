import VisitorLink from "../models/VisitorLink.js";

class VisitorLinkController {
  static async getByToken(req, res) {
    try {
      const { token } = req.params;
      const link = VisitorLink.findByToken(token);

      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }

      // Reject links whose underlying visit has ended (the known bug:
      // "QR code still showing after status is left").
      if (link.visit_time_out) {
        return res.status(410).json({
          error: "This visitor link has expired — the visit has ended.",
        });
      }
      if (
        link.visit_status &&
        ["completed", "rejected", "cancelled"].includes(link.visit_status)
      ) {
        return res.status(410).json({
          error: `This visitor link is no longer valid (status: ${link.visit_status}).`,
        });
      }

      const visitor = {
        id: link.visitor_id,
        fullname: link.visitor_name,
        contact_number: link.contact_number,
        address: link.address,
      };

      const office = {
        id: link.office_id,
        office_name: link.office_name,
        latitude: link.latitude,
        longitude: link.longitude,
        type: link.type,
      };

      res.json({
        visitor,
        office,
        visit_status: link.visit_status || "pending",
        created_at: link.created_at,
        expires_in_seconds: 28800,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const links = VisitorLink.findAll();

      const formatted = links.map((link) => ({
        token: link.token,
        visitor: {
          id: link.visitor_id,
          fullname: link.visitor_name,
          contact_number: link.contact_number,
          address: link.address,
        },
        office: {
          id: link.office_id,
          office_name: link.office_name,
          latitude: link.latitude,
          longitude: link.longitude,
          type: link.type,
        },
        created_at: link.created_at,
        expires_in_seconds: 28800,
      }));

      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default VisitorLinkController;
