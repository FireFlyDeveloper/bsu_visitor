import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import "./database/database.js";
import "./database/createTableImport.js";
import authRoutes from "./routes/authRoutes.js";
import visitorLogRoutes from "./routes/visitorLogRoutes.js";
import visitorRoutes from "./routes/visitorRoutes.js";
import officeRoutes from "./routes/officeRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import visitorStatusRoutes from "./routes/visitorStatusRoutes.js";
import securityGuardRoutes from "./routes/securityGuardRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import publicHomeRoutes from "./routes/publicHomeRoutes.js";
import multisetRoutes from "./routes/multisetRoutes.js";

const app = express();

// Middleware
app.use(helmet());

// CORS — comma-separated allowlist via CLIENT_URL.
// Examples:
//   CLIENT_URL=http://localhost:3000
//   CLIENT_URL=http://localhost:3000,https://my-tunnel.ngrok-free.app
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / curl / server-to-server (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/uploads", express.static("uploads"));
app.use("/api/users", authRoutes);
app.use("/api/visit-logs", visitorLogRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/offices", officeRoutes);
app.use("/api/visitor-status", visitorStatusRoutes);
app.use("/api/security-guard", securityGuardRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/public-home", publicHomeRoutes);
app.use("/api/multiset", multisetRoutes);
app.use("/api/roles", roleRoutes);
// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Error handler — convert multer's fileFilter rejection into 400 instead of 500
app.use((err, req, res, next) => {
  console.error(err.stack);

  // multer error from fileFilter (e.g. wrong mime type)
  if (err && err.message === "Only images are allowed") {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST;

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
