import Office from "../models/Office.js";

class SecurityController {
  static updateOfficeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate input
      if (!id) {
        return res.status(400).json({ error: "Office ID is required" });
      }

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Check if office exists
      const office = Office.findById(id);
      if (!office) {
        return res.status(404).json({ error: "Office not found" });
      }

      // Update status
      const updated = Office.updateStatus(id, status);

      if (!updated) {
        return res
          .status(500)
          .json({ error: "Failed to update office status" });
      }

      return res.status(200).json({
        message: "Office status updated successfully",
        office_id: id,
        new_status: status,
      });
    } catch (error) {
      console.error("Update Office Status Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default SecurityController;
