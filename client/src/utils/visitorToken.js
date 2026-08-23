/**
 * Visitor token cookie helpers.
 *
 * Visitors may register several people in one session (e.g. family members),
 * so every registration's opaque token is appended to a JSON array stored in
 * a one-day first-party cookie. The "Check your visit" page lists all saved
 * visits and lets the visitor open any of them. Only this device holds the
 * raw tokens — the backend stores only hashes.
 */
const COOKIE_NAME = "bsu_visitor_tokens";
const ONE_DAY_SECONDS = 60 * 60 * 24;

function readRaw() {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`),
  );
  if (!match) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeRaw(entries) {
  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(entries))}`,
    `max-age=${ONE_DAY_SECONDS}`,
    "path=/",
    "SameSite=Lax",
  ].join("; ");
}

/** A saved visit: { token, reference, office, at }. */
export function saveVisitorToken({ token, reference = "", office = "", at = Date.now() }) {
  if (!token) return;
  const entries = readRaw().filter((entry) => entry.token !== token);
  entries.unshift({ token, reference, office, at });
  writeRaw(entries.slice(0, 20));
}

export function getVisitorTokens() {
  return readRaw();
}
