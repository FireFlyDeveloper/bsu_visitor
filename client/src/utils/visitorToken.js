/**
 * Visitor token cookie helpers.
 *
 * The opaque visit token is stored in a long-lived first-party cookie so the
 * "Check your visit" page can find the visitor's latest registration even
 * after closing the browser or returning another day. Only this device holds
 * the raw token — the backend stores only its hash.
 */
const COOKIE_NAME = "bsu_visitor_token";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function saveVisitorToken(token) {
  if (!token) return;
  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `max-age=${ONE_YEAR_SECONDS}`,
    "path=/",
    "SameSite=Lax",
  ].join("; ");
}

export function readVisitorToken() {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : "";
}
