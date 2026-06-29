import Visitor from "../models/Visitor.js";

class VisitorController {
  static create(req, res) {
    try {
      const { fullname, contact_number, address, id_type, img } = req.body;

      if (!fullname || !contact_number || !address) {
        return res.status(400).json({
          error: "fullname, contact_number, and address are required",
        });
      }

      const visitorId = Visitor.create({
        fullname,
        contact_number,
        address,
        id_type,
        img,
      });

      res.status(201).json({
        message: "Visitor created successfully",
        visitorId,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static getAll(req, res) {
    try {
      const { fullname, contact_number } = req.query;
      let visitors = Visitor.findAll();

      if (fullname || contact_number) {
        visitors = visitors.filter((visitor) => {
          const matchesName = fullname
            ? visitor.fullname.toLowerCase().includes(fullname.toLowerCase())
            : false;
          const matchesContact = contact_number
            ? visitor.contact_number.includes(contact_number)
            : false;

          return matchesName || matchesContact;
        });
      }

      res.json(visitors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static getById(req, res) {
    try {
      const { id } = req.params;
      const visitor = Visitor.findById(id);

      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }

      res.json(visitor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static update(req, res) {
    try {
      const { id } = req.params;
      const visitor = Visitor.findById(id);

      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }

      const updatedData = {
        fullname: req.body.fullname ?? visitor.fullname,
        contact_number: req.body.contact_number ?? visitor.contact_number,
        address: req.body.address ?? visitor.address,
        id_type: req.body.id_type ?? visitor.id_type,
        img: req.body.img ?? visitor.img,
      };

      const success = Visitor.update(id, updatedData);

      if (!success) {
        return res.status(400).json({ error: "Unable to update visitor" });
      }

      res.json({ message: "Visitor updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static delete(req, res) {
    try {
      const { id } = req.params;
      const visitor = Visitor.findById(id);

      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }

      const success = Visitor.delete(id);
      if (!success) {
        return res.status(400).json({ error: "Unable to delete visitor" });
      }

      res.json({ message: "Visitor deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default VisitorController;
