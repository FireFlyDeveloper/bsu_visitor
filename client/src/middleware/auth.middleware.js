// middleware/auth.middleware.js
import { useUserStore } from "../store/user.js";

export async function authMiddleware(to, from, next) {
  const requiresAuth = to.meta?.requiresAuth ?? true;

  if (!requiresAuth) {
    return next();
  }

  const userStore = useUserStore();

  // reuse existing store method
  const user = userStore.currentUser || (await userStore.fetchCurrentUser());

  if (!user) {
    return next({
      name: "Login",
      query: { redirect: to.fullPath },
    });
  }

  next();
}

export async function guestMiddleware(to, from, next) {
  const userStore = useUserStore();

  const user = userStore.currentUser || (await userStore.fetchCurrentUser());

  if (user) {
    return next({ name: "Home" });
  }

  next();
}
