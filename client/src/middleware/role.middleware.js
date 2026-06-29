import { useUserStore } from "../store/user.js";

/**
 * Role Middleware (string-based)
 * @param {Array|string} allowedRoles - e.g. "admin" or ["admin", "staff"]
 */
export function roleMiddleware(allowedRoles) {
  return async (to, from, next) => {
    const userStore = useUserStore();

    try {
      if (!userStore.currentUser) {
        await userStore.fetchCurrentUser();
      }

      if (!userStore.isLoggedIn) {
        return next({ name: "login" });
      }

      const userRole = userStore.currentUser?.role?.name || null;

      const roles = Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles];

      if (!roles.includes(userRole)) {
        return next({ name: "Unauthorized" });
      }

      return next();
    } catch (error) {
      console.error("Middleware error:", error);
      return next({ name: "login" });
    }
  };
}