/**
 * Web Push subscription helpers.
 *
 * - Staff/security: subscribed after login via the authed endpoint
 *   (/api/mvp/push-subscriptions) with audience "office" or "security".
 * - Visitors: subscribed from the status page with the visit's opaque token
 *   (/api/mvp/push-subscriptions/visitor) so their device receives updates
 *   about that visit without an account.
 */
import { getVisitorTokens } from "@/utils/visitorToken";

const SW_PATH = "/sw.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function registerSW() {
  const reg = await navigator.serviceWorker.register(SW_PATH);
  await navigator.serviceWorker.ready;
  return reg;
}

/** Ask the browser for a subscription. Returns null when denied/unavailable. */
export async function acquireSubscription() {
  if (!pushSupported()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const reg = await registerSW();
  const keyRes = await fetch("/api/mvp/vapid-public-key");
  const { public_key } = await keyRes.json().catch(() => ({}));
  if (!public_key) return null;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(public_key),
  });
}

/** Subscribe the signed-in staff/security device. audience: office|security */
export async function subscribeStaff(audience) {
  const sub = await acquireSubscription();
  if (!sub) return false;
  const res = await fetch("/api/mvp/push-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ audience, subscription: sub.toJSON() }),
  });
  return res.ok;
}

/**
 * Subscribe every saved visit on this device (called from /status).
 * Returns count of successfully registered visits.
 */
export async function subscribeVisitorVisits() {
  const sub = await acquireSubscription();
  if (!sub) return 0;
  const visits = getVisitorTokens();
  let ok = 0;
  for (const visit of visits) {
    try {
      const res = await fetch("/api/mvp/push-subscriptions/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: visit.token, subscription: sub.toJSON() }),
      });
      if (res.ok) ok += 1;
    } catch (_) {
      /* keep trying remaining visits */
    }
  }
  return ok;
}
