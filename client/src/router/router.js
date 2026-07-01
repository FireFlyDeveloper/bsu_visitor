import { createWebHistory, createRouter } from "vue-router";
import { useUserStore } from "../store/user.js";
import LoginPage from "../views/AuthPages/LoginPage.vue";
import VisitorLogs from "../views/VisitorPages/VisitorLogs.vue";
import AdminDashboard from "../views/AdminPages/Dashboard.vue";
import UserList from "../views/AdminPages/UserList.vue";
import Register from "../views/AdminPages/Register.vue";
import AdminLayout from "../layouts/AdminLayout.vue";
import HomePage from "../views/HomePage.vue";

import { guestMiddleware } from "../middleware/auth.middleware.js";

import StaffDashboard from "../views/StaffPages/StaffDashboard.vue";
import VisitorQueue from "../views/StaffPages/VisitorQueue.vue";
import StaffVisitorLogs from "../views/StaffPages/StaffVisitorLogs.vue";
import { roleMiddleware } from "../middleware/role.middleware.js";
import UnauthorizePage from "../views/ErrorPages/UnauthorizePage.vue";
import Offices from "../views/AdminPages/Offices.vue";
import ShowVisitors from "../views/VisitorPages/ShowVisitors.vue";
import VisitorStatus from "../views/GuardPages/VisitorStatus.vue";
import OfficeStatus from "../views/GuardPages/OfficeStatus.vue";
import ShowQr from "../views/VisitorPages/ShowQr.vue";

const routes = [
  { path: "/", name: "Home", component: HomePage },
  {
    // Public per-office fixed-QR landing page.
    // Visitors scan the QR stuck on the office door → land here
    // → self-register (no auth, no photo).
    path: "/office/:id",
    name: "OfficeVisitorAccess",
    component: () =>
      import("../views/PublicPages/OfficeVisitorAccess.vue"),
    meta: { requiresAuth: false },
  },
  {
    // /office (no id) — same page, starts in destination-picker mode.
    path: "/office",
    name: "OfficeVisitorPicker",
    component: () =>
      import("../views/PublicPages/OfficeVisitorAccess.vue"),
    meta: { requiresAuth: false },
  },
  {
    // AR navigation — opens the device camera and renders a 3D
    // arrow toward the destination office. Multiset VPS is wired
    // via env (VITE_MULTISET_API_KEY, VITE_MULTISET_MAP_ID);
    // manual bearing slider is the fallback.
    path: "/navigate",
    name: "NavAr",
    component: () => import("../views/PublicPages/NavAr.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/qr-code",
    name: "QRCode",
    component: ShowQr,
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { requiresAuth: false },
    beforeEnter: guestMiddleware,
  },
  {
    // /visitors/create is now an alias for the visitor log.
    // The actual visitor registration happens at /security/kiosk
    // for guards. The old CreateVisitor form was removed.
    path: "/visitors/create",
    redirect: { name: "VisitorLogs" },
  },
  {
    // Authenticated shared pages — wrapped in the BSU app shell
    // (navbar + content container) so they get the same header as
    // the admin/staff/security pages.
    path: "/visitors/logs",
    component: AdminLayout,
    children: [
      {
        path: "",
        name: "VisitorLogs",
        component: VisitorLogs,
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: "/qr-code",
    component: AdminLayout,
    children: [
      {
        path: "",
        name: "QRCode",
        component: ShowQr,
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: "/unauthorized",
    name: "Unauthorized",
    component: UnauthorizePage,
  },
  {
    path: "/admin",
    component: AdminLayout,
    children: [
      {
        path: "users", // relative path
        name: "UserList",
        component: UserList,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("admin"),
      },
      {
        path: "register",
        name: "AdminRegister",
        component: Register,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("admin"),
      },
      {
        path: "dashboard", // relative path
        name: "AdminDashboard",
        component: AdminDashboard,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("admin"),
      },
      {
        path: "offices", // relative path
        name: "Offices",
        component: Offices,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("admin"),
      },
      {
        path: "", // default child route
        redirect: { name: "AdminDashboard" },
      },
    ],
  },
  {
    path: "/staff",
    component: AdminLayout,
    children: [
      {
        path: "dashboard",
        name: "StaffDashboard",
        component: StaffDashboard,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("staff"),
      },
      {
        path: "visitors/queue",
        name: "VisitorQueue",
        component: VisitorQueue,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("staff"),
      },
      {
        path: "visitors/logs",
        name: "StaffVisitorLogs",
        component: StaffVisitorLogs,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("staff"),
      },
      {
        path: "visitors",
        name: "VisitorProfile",
        component: ShowVisitors,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("staff"),
      },
      {
        path: "",
        redirect: { name: "StaffDashboard" },
      },
    ],
  },
  {
    path: "/security",
    component: AdminLayout,
    children: [
      {
        // /security → visitor status (the dashboard has been merged
        // into the home page; security opens Visitor Status directly)
        path: "",
        name: "SecurityPanel",
        redirect: { name: "SecurityVisitorStatus" },
      },
      {
        path: "kiosk",
        name: "SecurityKiosk",
        component: () => import("../views/GuardPages/Kiosk.vue"),
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("security"),
      },
      {
        path: "visitors/status",
        name: "SecurityVisitorStatus",
        component: VisitorStatus,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("security"),
      },
      {
        path: "offices/status",
        name: "SecurityOfficeStatus",
        component: OfficeStatus,
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("security"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

//  Global auth guard
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // Fetch current user if not already loaded
  if (!userStore.currentUser) {
    await userStore.fetchCurrentUser().catch(() => null);
  }

  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !userStore.isLoggedIn) {
    // Redirect to login if not logged in
    return next({ name: "Login" });
  }

  next();
});

export default router;
