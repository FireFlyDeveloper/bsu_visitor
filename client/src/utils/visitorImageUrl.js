const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export function visitorImageUrl(path) {
  if (!path) return "";

  const normalizedPath = String(path).trim();
  if (!normalizedPath) return "";

  if (
    ABSOLUTE_URL_PATTERN.test(normalizedPath) ||
    normalizedPath.startsWith("//")
  ) {
    return normalizedPath;
  }

  return normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;
}
