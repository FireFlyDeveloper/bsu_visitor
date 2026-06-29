import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "sample_secret_key";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

class UserController {
  static requiresOffice(roleId) {
    return Number(roleId) === 3;
  }

  static login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password required" });
      }

      const user = User.findByUsername(username);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isPasswordValid = User.verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role_id: user.role_id },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY },
      );

      // Set httpOnly cookie
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          fullname: user.fullname,
          username: user.username,
          role_id: user.role_id,
          office_id: user.office_id,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static logout(req, res) {
    try {
      res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.json({ message: "Logout successful" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static getCurrentUser(req, res) {
    try {
      const user = User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          fullname: user.fullname,
          username: user.username,
          role_id: user.role_id,
          office_id: user.office_id,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static getAll(req, res) {
    try {
      const users = User.findAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static getAllWithLastActivity(req, res) {
    try {
      const users = User.findAllWithLastActivity();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static getById(req, res) {
    try {
      const { id } = req.params;
      const user = User.findById(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static create(req, res) {
    try {
      const { fullname, username, password, role_id, office_id } = req.body;
      const normalizedRoleId = Number(role_id);
      const normalizedOfficeId =
        office_id === undefined ||
        office_id === null ||
        office_id === "" ||
        isNaN(Number(office_id))
          ? null
          : Number(office_id);

      if (!fullname || !username || !password || !normalizedRoleId) {
        return res.status(400).json({
          error: "fullname, username, password, and role_id are required",
        });
      }

      if (
        UserController.requiresOffice(normalizedRoleId) &&
        !normalizedOfficeId
      ) {
        return res
          .status(400)
          .json({ error: "office_id is required for visitors" });
      }

      const existingUser = User.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const userId = User.create({
        fullname,
        username,
        password,
        role_id: normalizedRoleId,
        office_id: normalizedOfficeId,
      });

      res.status(201).json({
        message: "User created successfully",
        userId,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static update(req, res) {
    try {
      const { id } = req.params;
      const { fullname, username, role_id, office_id } = req.body;
      const normalizedRoleId =
        role_id !== undefined ? Number(role_id) : undefined;
      const normalizedOfficeId =
        office_id === "" || office_id === null || office_id === undefined
          ? null
          : Number(office_id);

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const nextRoleId = normalizedRoleId || user.role_id;
      const nextOfficeId =
        office_id !== undefined ? normalizedOfficeId : user.office_id;

      if (UserController.requiresOffice(nextRoleId) && !nextOfficeId) {
        return res
          .status(400)
          .json({ error: "office_id is required for visitors" });
      }

      const success = User.update(id, {
        fullname: fullname || user.fullname,
        username: username || user.username,
        role_id: nextRoleId,
        office_id: nextOfficeId,
      });

      if (success) {
        res.json({ message: "User updated successfully" });
      } else {
        res.status(400).json({ error: "Unable to update user" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static delete(req, res) {
    try {
      const { id } = req.params;

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const success = User.delete(id);

      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(400).json({ error: "Unable to delete user" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default UserController;
