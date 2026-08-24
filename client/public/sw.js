/* BSU Visitor push service worker.
 * Receives web-push events and shows notifications. Clicking a notification
 * focuses (or opens) the app at the relevant page. */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { notification: { title: "BSU Visitor", body: event.data?.text || "" } };
  }
  const n = payload.notification || {};
  const data = payload.data || {};
  const title = n.title || "BSU Visitor";
  const options = {
    body: n.body || "",
    icon: "/img/bsu_outside.png",
    badge: "/img/bsu_outside.png",
    tag: n.tag,
    requireInteraction: Boolean(n.requireInteraction),
    data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    event.notification.data?.type === "status" ||
    event.notification.data?.type === "signed_out" ||
    event.notification.data?.type === "overdue_reminder"
      ? "/status"
      : event.currentTarget === null
        ? "/"
        : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
