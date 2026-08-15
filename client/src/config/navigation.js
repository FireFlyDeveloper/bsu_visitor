export const roleNames = {
  admin: "Administrator",
  staff: "Office staff",
  security: "Security",
};

export const roleNavigation = {
  admin: [
    { label: "Overview", to: "/admin/dashboard", icon: "grid" },
    { label: "Offices & availability", to: "/admin/offices", icon: "building" },
    { label: "Visitor operations", to: "/visitors/logs", icon: "users" },
    { label: "Users", to: "/admin/users", icon: "user" },
    { label: "QR management", to: "/qr-code", icon: "qr" },
  ],
  staff: [
    { label: "Office overview", to: "/staff/dashboard", icon: "grid" },
    { label: "Visitor queue", to: "/staff/visitors/queue", icon: "queue" },
    { label: "Visitor history", to: "/staff/visitors/logs", icon: "clock" },
    { label: "Office availability", to: "/staff/dashboard#availability", icon: "building" },
    { label: "Profile", to: "/staff/visitors", icon: "user" },
  ],
  security: [
    { label: "Security overview", to: "/security/visitors/status", icon: "grid" },
    { label: "Kiosk registration", to: "/security/kiosk", icon: "id" },
    { label: "Active & sign-out", to: "/security/visitors/status", icon: "users" },
    { label: "Office availability", to: "/security/offices/status", icon: "building" },
    { label: "Notifications", to: "/security/visitors/status#notifications", icon: "bell" },
  ],
};

export const publicNavigation = [
  { label: "Find an Office", to: "/directory" },
  { label: "Register", to: "/register" },
  { label: "Check Status", to: "/status" },
  { label: "AR Navigation", to: "/office" },
];

export function roleKeyFromId(roleId) {
  return { 1: "admin", 2: "security", 3: "staff" }[Number(roleId)] || null;
}
