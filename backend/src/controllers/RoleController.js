import db from "../database/database.js";

export const getRoles = (req, res) => {
  try {
    const roles = db.prepare(`SELECT * FROM roles`).all();

    res.json({
      success: true,
      roles,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};