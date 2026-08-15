import db from "../database/database.js";

/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.use(authMiddleware, roleMiddleware("admin"));
 *   router.use(authMiddleware, roleMiddleware(["admin", "staff"]));
 *
 * Resolves the role name from the `roles` table via req.user.role_id.
 * Falls back to a role_id check if the join is unavailable, so this
 * works for tokens issued before the role table existed.
 */
export const roleMiddleware = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Resolve role name. Cache the lookup on req for downstream handlers.
    const userId = req.user.id;
    const userRow = db
      .prepare(
        `SELECT u.role_id, r.role_name
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         WHERE u.id = ?`,
      )
      .get(userId);

    const roleName = userRow?.role_name || null;
    const roleId = userRow?.role_id ?? req.user.role_id ?? null;

    if (!userRow || (!roles.includes(roleName) && !roles.includes(String(roleId)))) {
      return res.status(403).json({
        error: "Forbidden: insufficient role",
        required: roles,
        actual: roleName || `role_id:${roleId}`,
      });
    }

    req.user.role = roleName;
    req.user.role_id = roleId;
    next();
  };
};

export default roleMiddleware;
