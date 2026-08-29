/**
 * Guard kiosk — recent-registration QR cache.
 *
 * The backend intentionally stores only hashed visit tokens (raw tokens are
 * handed to the visitor's own device), so the raw token for a registration
 * exists exactly once: in the kiosk submit response. To let the guard
 * re-show a visitor's QR from the "Recent kiosk registrations" feed, we
 * cache {logId -> token} on THIS kiosk device for a limited window.
 *
 * It is a convenience cache, not a store of record: entries expire and the
 * QR modal degrades gracefully when a log id has no cached token (e.g. the
 * feed shows registrations made on another device).
 */
const CACHE_KEY = "bsu_guard_kiosk_qrs";
const TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const MAX_ENTRIES = 100;

function readRaw() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeRaw(entries) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch (_) {
    /* storage full/blocked — QR just won't be re-showable */
  }
}

/** Entry: { logId, token, office, reference, name, at }. */
export function cacheKioskQr(entry) {
  if (!entry || !entry.logId || !entry.token) return;
  const now = Date.now();
  const entries = readRaw().filter((e) => e.logId !== entry.logId && now - e.at < TTL_MS);
  entries.unshift({ ...entry, at: now });
  writeRaw(entries);
}

export function getCachedKioskQr(logId) {
  if (logId == null) return null;
  const now = Date.now();
  const found = readRaw().find(
    (e) => String(e.logId) === String(logId) && now - e.at < TTL_MS,
  );
  return found || null;
}

/** Enrich a list of visit-log rows with their cached QR token, in place. */
export function attachCachedQrs(logs) {
  if (!Array.isArray(logs)) return logs;
  for (const log of logs) {
    const cached = getCachedKioskQr(log.id);
    if (cached) {
      log.qrToken = cached.token;
      if (!log.reference_number) log.reference_number = cached.reference || "";
    }
  }
  return logs;
}