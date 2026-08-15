import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters");
}

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Token invalid or expired, but we don't require it
    next();
  }
};
