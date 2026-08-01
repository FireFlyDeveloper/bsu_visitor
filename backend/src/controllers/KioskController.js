import Visitor from "../models/Visitor.js";
import VisitLog from "../models/VisitLog.js";

class KioskController {
  static register(req, res) {
    try {
      // Guard against undefined req.body (happens with no body / no Content-Type
      // / no multer fields) so we return a clean 400 instead of a 500 from
      // the destructure below.
      const body = req.body || {};
      const {
        fullname,
        contact_number,
        address = "",
        id_type = "",
        office_id,
        purpose = "",
      } = body;

      if (!fullname || !contact_number || !office_id) {
        return res.status(400).json({
          error: "fullname, contact_number, and office_id are required",
        });
      }

      if (!address) {
        return res.status(400).json({
          error: "address is required",
        });
      }

      const parsedOfficeId = Number(office_id);
      if (!Number.isFinite(parsedOfficeId)) {
        return res.status(400).json({ error: "office_id must be numeric" });
      }

      // Photo is required for the kiosk flow
      if (!req.file) {
        return res.status(400).json({ error: "img (visitor photo) is required" });
      }

      const img = `uploads/${req.file.filename}`;

      // Reuse create-or-find
      let visitor = Visitor.findByContactNumber(contact_number);
      if (!visitor) {
        const newVisitorId = Visitor.create({
          fullname,
          contact_number,
          address,
          id_type,
          img,
        });
        visitor = Visitor.findById(newVisitorId);
      } else {
        // Update photo on existing visitor (kiosk re-registering a repeat visitor)
        Visitor.update(visitor.id, { img });
        visitor = Visitor.findById(visitor.id);
      }

      const logId = VisitLog.create({
        visitor_id: visitor.id,
        office_id: parsedOfficeId,
        purpose,
        logged_by: req.user?.id || null,
        status: "pending",
        visitor_img: img,
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;

      if (visitor.img) {
        visitor.img = `${baseUrl}/${visitor.img}`;
      }

      return res.status(201).json({
        visitor,
        logId,
        office_id: parsedOfficeId,
      });
    } catch (error) {
      console.error("kiosk register error:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

export default KioskController;
