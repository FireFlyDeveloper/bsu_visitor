import { createWebHistory, createRouter } from "vue-router";
import { useUserStore } from "../store/user.js";
import LoginPage from "../views/AuthPages/LoginPage.vue";
import VisitorLogs from "../views/VisitorPages/VisitorLogs.vue";
import AdminDashboard from "../views/AdminPages/Dashboard.vue";
import UserList from "../views/AdminPages/UserList.vue";
import Register from "../views/AdminPages/Register.vue";
import AdminLayout from "../layouts/AdminLayout.vue";
import PublicShell from "../layouts/PublicShell.vue";
import HomePage from "../views/HomePage.vue";

import { guestMiddleware } from "../middleware/auth.middleware.js";

import StaffDashboard from "../views/StaffPages/StaffDashboard.vue";
import VisitorQueue from "../views/StaffPages/VisitorQueue.vue";
import StaffVisitorLogs from "../views/StaffPages/StaffVisitorLogs.vue";
import { roleMiddleware } from "../middleware/role.middleware.js";
import UnauthorizePage from "../views/ErrorPages/UnauthorizePage.vue";
import Offices from "../views/AdminPages/Offices.vue";
import VisitorStatus from "../views/GuardPages/VisitorStatus.vue";
import OfficeStatus from "../views/GuardPages/OfficeStatus.vue";
import PublicDirectory from "../views/PublicPages/PublicDirectory.vue";
import PublicRegister from "../views/PublicPages/PublicRegister.vue";
import PublicStatus from "../views/PublicPages/PublicStatus.vue";

const routes = [
  {
    path: "/",
    component: PublicShell,
    children: [
      { path: "", name: "Home", component: HomePage },
      { path: "directory", name: "PublicDirectory", component: PublicDirectory },
      { path: "register", name: "PublicRegister", component: PublicRegister },
      { path: "status", name: "PublicStatus", component: PublicStatus },
    ],
    meta: { requiresAuth: false, publicShell: true },
  },
  {
    // Public per-office fixed-QR landing page.
    // Visitors scan the QR stuck on the office door → land here
    // → self-register (no auth, no photo).
    path: "/office/:id",
    name: "OfficeVisitorAccess",
    component: PublicShell,
    children: [{ path: "", component: () => import("../views/PublicPages/OfficeVisitorAccess.vue") }],
    meta: { requiresAuth: false, publicShell: true },
  },
  {
    // /office (no id) — public AR navigation picker.
    // Visitors can open the WebXR navigation flow without login.
    path: "/office",
    name: "OfficeNavPicker",
    component: PublicShell,
    children: [{ path: "", component: () => import("../views/PublicPages/OfficeNavPicker.vue") }],
    meta: { requiresAuth: false, publicShell: true },
  },
  {
    // AR navigation — opens the device camera and renders a 3D
    // arrow toward the destination office using the BSU Multiset map id
    // from src/config/arNavigation.js.
    path: "/navigate",
    name: "NavAr",
    component: PublicShell,
    children: [{ path: "", component: () => import("../views/PublicPages/NavAr.vue") }],
    meta: { requiresAuth: false, publicShell: true },
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
        // /security → security overview dashboard
        path: "",
        name: "SecurityOverviewRedirect",
        redirect: { name: "SecurityOverview" },
      },
      {
        path: "overview",
        name: "SecurityOverview",
        component: () => import("../views/GuardPages/SecurityDashboard.vue"),
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("security"),
      },
      {
        path: "notifications",
        name: "SecurityNotifications",
        component: () => import("../views/GuardPages/SecurityNotifications.vue"),
        meta: { requiresAuth: true },
        beforeEnter: roleMiddleware("security"),
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
