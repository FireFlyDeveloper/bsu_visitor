import "dotenv/config";
import os from "node:os";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import "./database/database.js";
import "./database/createTableImport.js";
// MVP tables (system_settings, visitor_access_tokens, push_subscriptions,
// notification_events) — idempotent; must run before mvpRoutes are used.
import "./database/migrateMvp.js";
import authRoutes from "./routes/authRoutes.js";
import visitorLogRoutes from "./routes/visitorLogRoutes.js";
import visitorRoutes from "./routes/visitorRoutes.js";
import officeRoutes from "./routes/officeRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import visitorStatusRoutes from "./routes/visitorStatusRoutes.js";
import securityGuardRoutes from "./routes/securityGuardRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import publicHomeRoutes from "./routes/publicHomeRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import multisetRoutes from "./routes/multisetRoutes.js";
import mvpRoutes from "./routes/mvpRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { roleMiddleware } from "./middleware/roleMiddleware.js";
import { serveVisitorImage } from "./controllers/VisitorImageController.js";

const app = express();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters");
}

// Middleware
app.use(helmet());

// CORS is strict in production. In development, configured origins are
// additive so an inherited/stale CLIENT_URL cannot omit the active Vite port.
// CLIENT_EXTRA_ORIGINS adds origins (e.g. LAN hostnames) that interface-scan
// based defaults cannot know about.
const configuredClientUrl = process.env.CLIENT_URL?.trim();
const extraClientOrigins = process.env.CLIENT_EXTRA_ORIGINS?.trim();
const vitePort = Number(process.env.VITE_PORT || 5173);
// HTTPS dev instances (camera testing) run on their own port.
const viteHttpsPort = Number(process.env.VITE_HTTPS_PORT || 5174);
const lanHosts = Object.values(os.networkInterfaces())
  .flat()
  .filter((network) => network && network.family === "IPv4" && !network.internal && !/^(docker|veth|br-)/.test(network.address))
  .map((network) => network.address);
const defaultDevelopmentOrigins = [
  `http://localhost:${vitePort}`,
  `http://127.0.0.1:${vitePort}`,
  `http://192.168.8.41:${vitePort}`,
  ...lanHosts.map((host) => `http://${host}:${vitePort}`),
  // Camera testing needs a secure context: allow the HTTPS dev origin too
  // (same hostnames, https scheme, dedicated port).
  `https://localhost:${viteHttpsPort}`,
  `https://127.0.0.1:${viteHttpsPort}`,
  `https://192.168.8.41:${viteHttpsPort}`,
  ...lanHosts.map((host) => `https://${host}:${viteHttpsPort}`),
];
const normalizeOrigin = (origin) => {
  try {
    return new URL(origin.trim()).origin;
  } catch {
    return null;
  }
};
const configuredOrigins = [
  ...(configuredClientUrl || "").split(","),
  ...(extraClientOrigins || "").split(","),
]
  .map(normalizeOrigin)
  .filter(Boolean);
const allowedOrigins = [...new Set(
  process.env.NODE_ENV === "production"
    ? configuredOrigins
    : [...configuredOrigins, ...defaultDevelopmentOrigins.map(normalizeOrigin).filter(Boolean)],
)];

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
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, parameterLimit: 100, limit: "100kb" }));
app.use(cookieParser());

// Routes
app.get("/api/visitor-images/:filename", authMiddleware, roleMiddleware(["admin", "staff", "security"]), serveVisitorImage);
app.use("/api/users", authRoutes);
app.use("/api/visit-logs", visitorLogRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/offices", officeRoutes);
app.use("/api/visitor-status", visitorStatusRoutes);
app.use("/api/security-guard", securityGuardRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/public-home", publicHomeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/multiset", multisetRoutes);
app.use("/api/mvp", mvpRoutes);

// Periodic sweep: completed-but-not-signed-out visits past their deadline
// trigger security + visitor push notifications (deduplicated).
import { startOverdueSweeper } from "./services/overdueSweeper.js";
startOverdueSweeper();
app.use("/api/roles", roleRoutes);
// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Error handler — convert multer's fileFilter rejection into 400 instead of 500
app.use((err, req, res, next) => {
  console.error(err.stack);

  // multer error from fileFilter (e.g. wrong mime type)
  if (err && (err.message === "Only images are allowed" || err.message.includes("images are allowed") || err.code === "LIMIT_FILE_SIZE")) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8765;
const HOST = process.env.HOST;

app.listen(PORT, HOST, () => {
  // HOST may be unset (Node then binds all interfaces) — don't print "undefined".
  console.log(`Server running on http://${HOST || "0.0.0.0"}:${PORT}`);
});
