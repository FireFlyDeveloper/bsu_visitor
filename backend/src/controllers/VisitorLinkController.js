import VisitorLink from "../models/VisitorLink.js";

class VisitorLinkController {
  static async getByToken(req, res) {
    try {
      const { token } = req.params;
      const link = VisitorLink.findByToken(token);

      if (!link) {
        return res.status(404).json({ error: "Link not found" });
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
