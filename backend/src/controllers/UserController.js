import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET, JWT_EXPIRY } from "../config/auth.js";

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
        // Only staff (role_id 3) is required to have an office.
        // Admins and security may or may not have an office.
        normalizedRoleId === 3 &&
        !normalizedOfficeId
      ) {
        return res
          .status(400)
          .json({ error: "office_id is required for staff accounts" });
      }

      if (String(password).length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
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
      const { fullname, username, role_id, office_id, password } = req.body;
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
          .json({ error: "office_id is required for staff accounts" });
      }

      // Optional password reset — must be at least 6 chars if provided.
      if (password !== undefined && password !== null && password !== "") {
        if (String(password).length < 6) {
          return res
            .status(400)
            .json({ error: "Password must be at least 6 characters" });
        }
      }

      const success = User.update(id, {
        fullname: fullname || user.fullname,
        username: username || user.username,
        role_id: nextRoleId,
        office_id: nextOfficeId,
        ...(password && { password }),
      });

      if (success) {
        res.json({ message: "User updated successfully" });
      } else {
        res.status(400).json({ error: "Unable to update user" });
      }
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || /UNIQUE constraint failed: users\.username/.test(error.message)) {
        return res.status(409).json({ error: "Username already exists" });
      }
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

      if (Number(req.user.id) === Number(id)) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }
      if (Number(user.role_id) === 1 && User.countAdmins() <= 1) {
        return res.status(409).json({ error: "The last administrator cannot be deleted" });
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
