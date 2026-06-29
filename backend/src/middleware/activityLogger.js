import ActivityLog from "../models/ActivityLog.js";

const METHOD_TO_ACTION = Object.freeze({
  GET: "READ",
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
});

const SENSITIVE_KEYS = new Set([
  "password",
  "password_hash",
  "passwordHash",
  "authToken",
  "token",
  "refreshToken",
  "refresh_token",
]);

const MAX_JSON_CHARS = 10_000;

function redactSensitive(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redactSensitive);

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) {
      out[key] = "[REDACTED]";
    } else {
      out[key] = redactSensitive(val);
    }
  }
  return out;
}

function safeJSONStringify(value) {
  try {
    const json = JSON.stringify(value);
    if (typeof json === "string" && json.length > MAX_JSON_CHARS) {
      return json.slice(0, MAX_JSON_CHARS) + "...[truncated]";
    }
    return json;
  } catch {
    return JSON.stringify({ error: "unserializable" });
  }
}

function inferEntity(req) {
  // Example baseUrl: "/api/visitors"
  const baseUrl = req.baseUrl || "";
  const parts = baseUrl.split("/").filter(Boolean);

  const apiIndex = parts.indexOf("api");
  if (apiIndex >= 0 && parts[apiIndex + 1]) return parts[apiIndex + 1];

  return parts[parts.length - 1] || null;
}

function inferEntityId(req) {
  const params = req.params || {};

  return (
    params.id ??
    params.officeId ??
    params.office_id ??
    params.visitorId ??
    params.visitor_id ??
    params.token ??
    null
  );
}

export const activityLogger = (req, res, next) => {
  res.on("finish", () => {
    try {
      const userId = req.user?.id;
      if (!userId) return;

      ActivityLog.create({
        user_id: userId,
        action: METHOD_TO_ACTION[req.method] ?? req.method,
        method: req.method,
        entity: inferEntity(req),
        entity_id: inferEntityId(req),
        path: req.originalUrl,
        query: safeJSONStringify(redactSensitive(req.query)),
        body: safeJSONStringify(redactSensitive(req.body)),
        status_code: res.statusCode,
      });
    } catch (err) {
      // Never break the request lifecycle because of logging.
      console.error("Failed to write activity log:", err);
    }
  });

  next();
};
