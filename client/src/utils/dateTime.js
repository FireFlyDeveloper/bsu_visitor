const SQLITE_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

export function parseServerDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // SQLite CURRENT_TIMESTAMP returns UTC as "YYYY-MM-DD HH:mm:ss" with no zone.
  // Add UTC marker so browsers do not interpret it as local Manila time.
  const normalized = SQLITE_TIMESTAMP_PATTERN.test(raw)
    ? `${raw.replace(" ", "T")}Z`
    : raw;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatServerTime(value) {
  const date = parseServerDate(value);
  if (!date) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatServerDateTime(value) {
  const date = parseServerDate(value);
  if (!date) return "—";
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function elapsedFromServerTime(startValue, endValue = Date.now()) {
  const start = parseServerDate(startValue);
  const end = endValue instanceof Date ? endValue : parseServerDate(endValue) || new Date(endValue);

  if (!start || Number.isNaN(end.getTime())) {
    return { minutes: 0, seconds: 0, display: "—" };
  }

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  return {
    minutes,
    seconds,
    display: minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
      : `${minutes}m ${seconds}s`,
  };
}
