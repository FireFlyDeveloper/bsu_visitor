import { createWebHistory, createRouter } from "vue-router";
import { useUserStore } from "../store/user.js";
import LoginPage from "../views/AuthPages/LoginPage.vue";
import CreateVisitor from "../views/VisitorPages/CreateVisitor.vue";
import VisitorLogs from "../views/VisitorPages/VisitorLogs.vue";
import VisitorAccess from "../views/VisitorPages/VisitorAccess.vue";
import AdminDashboard from "../views/AdminPages/dashboard.vue";
import UserList from "../views/AdminPages/UserList.vue";
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
    path: "/visitor-access/:token",
    name: "VisitorAccess",
    component: VisitorAccess,
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
    path: "/visitors/create",
    name: "CreateVisitor",
    component: CreateVisitor,
    meta: { requiresAuth: true },
  },
  {
    path: "/visitors/logs",
    name: "VisitorLogs",
    component: VisitorLogs,
    meta: { requiresAuth: true },
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
    name: "SecurityPanel",
    component: AdminLayout,
    children: [
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
