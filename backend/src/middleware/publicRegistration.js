const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function publicRegistrationGuard(req, res, next) {
  const now = Date.now();
  const key = req.ip || "unknown";
  const recent = (attempts.get(key) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) return res.status(429).json({ error: "Too many registration attempts. Try again later." });
  recent.push(now);
  attempts.set(key, recent);
  next();
}

export function validatePublicRegistration(req, res, next) {
  const body = req.body || {};
  const fields = { fullname: 120, contact_number: 30, address: 255, purpose: 255 };
  for (const [field, max] of Object.entries(fields)) {
    if (body[field] !== undefined && (typeof body[field] !== "string" || body[field].trim().length > max)) {
      return res.status(400).json({ error: `${field} is invalid` });
    }
  }
  if (!body.fullname?.trim() || !body.contact_number?.trim() || !body.address?.trim()) {
    return res.status(400).json({ error: "fullname, contact_number, and address are required" });
  }
  next();
}
