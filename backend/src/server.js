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
import visitorLinkRoutes from "./routes/visitorLinkRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import visitorStatusRoutes from "./routes/visitorStatusRoutes.js";
import securityGuardRoutes from "./routes/securityGuardRoutes.js";

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "intussusceptive-skimpily-ona.ngrok-free.dev",
    ],
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
app.use("/api/visitor-links", visitorLinkRoutes);
app.use("/api/visitor-status", visitorStatusRoutes);
app.use("/api/security-guard", securityGuardRoutes);
app.use("/api/roles", roleRoutes);
// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST;

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
